import { useCallback, useEffect, useState } from 'react';
import axiosClient from '../../../shared/environment/envdev';

type SubscriptionStatus = {
  subscribed: boolean;
  count?: number;
};

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  // Récupérer le token depuis localStorage (priorité à access_token)
  const token = localStorage.getItem('access_token') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('access_token');

  // Log pour déboguer
  if (!token) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Aucun token trouvé dans le localStorage');
    // eslint-disable-next-line no-console
    console.log('Clés disponibles:', Object.keys(localStorage));
  }

  return token;
};

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    // Vérifier si c'est un JWT (contient 3 parties séparées par des points)
    const parts = token.split('.');
    if (parts.length !== 3) return true; // Si ce n'est pas un JWT, on considère qu'il est valide

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    // Si on ne peut pas décoder, on considère que le token est valide
    return true;
  }
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  const checkPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    setLoading(false);
  }, []);

  const registerServiceWorker = useCallback(async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur enregistrement Service Worker:', error);
    }
  }, []);

  const fetchVapidKey = useCallback(async () => {
    try {
      const response = await axiosClient.get('/push/vapid-public-key');
      const key = response.data.public_key as string | undefined;
      if (key) {
        setVapidPublicKey(key);
        return key;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur récupération clé VAPID:', error);
    }

    return null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkPermission();
      registerServiceWorker();
      fetchVapidKey();
    } else {
      setIsSupported(false);
      setLoading(false);
    }
  }, [checkPermission, registerServiceWorker, fetchVapidKey]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Notifications non supportées');
    }

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications non supportées');
    }

    // Vérifier d'abord si la permission est déjà refusée
    if (permission === 'denied') {
      throw new Error('Les notifications sont bloquées dans les paramètres de votre navigateur. Veuillez les autoriser dans les paramètres pour activer les notifications push.');
    }

    const key = vapidPublicKey ?? (await fetchVapidKey());
    if (!key) {
      throw new Error('Clé VAPID non disponible');
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        if (newPermission === 'denied') {
          throw new Error('Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.');
        }
        throw new Error('Permission refusée');
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const token = getStoredToken();
      if (!token) {
        // eslint-disable-next-line no-console
        console.error('❌ Token manquant pour la souscription push');
        // eslint-disable-next-line no-console
        console.log('Vérification localStorage:', {
          access_token: localStorage.getItem('access_token'),
          token: localStorage.getItem('token'),
          auth_token: localStorage.getItem('auth_token'),
        });
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier si le token est valide
      if (!isTokenValid(token)) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Token invalide ou expiré');
        throw new Error('Token invalide ou expiré. Veuillez vous reconnecter.');
      }

      // eslint-disable-next-line no-console
      console.log('🔐 Token récupéré pour push subscription:', token.substring(0, 20) + '...');

      const response = await axiosClient.post('/push/subscribe', {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')),
        },
        contentEncoding: 'aesgcm',
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Erreur lors de l'enregistrement");
      }

      // eslint-disable-next-line no-console
      console.log('✅ Souscription push enregistrée avec succès:', response.data);
      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur souscription:', error);
      throw error;
    }
  }, [isSupported, permission, vapidPublicKey, requestPermission, fetchVapidKey]);

  const unsubscribe = useCallback(async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
      }

      await axiosClient.post('/push/unsubscribe');

      setSubscription(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur désinscription:', error);
      throw error;
    }
  }, [subscription]);

  const checkSubscriptionStatus = useCallback(async (): Promise<SubscriptionStatus> => {
    const token = getStoredToken();
    if (!token) {
      return { subscribed: false, count: 0 };
    }

    try {
      const response = await axiosClient.get('/push/status');
      return response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur vérification statut:', error);
    }

    return { subscribed: false, count: 0 };
  }, []);

  return {
    isSupported,
    subscription,
    permission,
    loading,
    vapidPublicKey,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
  };
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
  if (!buffer) {
    throw new Error('Clé de souscription manquante');
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
};

