import { useEffect, useState } from 'react';
import { usePushNotificationContext } from '../context/PushNotificationContext';

type PushNotificationPromptProps = {
  onEnabled?: () => void;
  onDismissed?: () => void;
};

export const PushNotificationPrompt = ({ onEnabled, onDismissed }: PushNotificationPromptProps) => {
  const { isSupported, permission, loading, isSubscribed, enableNotifications } =
    usePushNotificationContext();

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Ne jamais afficher le prompt si :
    // - Les notifications ne sont pas supportées
    // - Le chargement est en cours (vérification du statut)
    // - L'utilisateur est déjà souscrit
    if (!isSupported || loading || isSubscribed) {
      setShowPrompt(false);
      return;
    }

    // Afficher le prompt uniquement si :
    // - L'utilisateur n'est pas encore souscrit
    // - Le chargement est terminé
    // Attendre que le statut soit bien vérifié
    const timer = setTimeout(() => {
      // Vérifier une dernière fois avant d'afficher
      if (!isSubscribed && !loading && isSupported) {
        setShowPrompt(true);
      }
    }, 1500); // Augmenter le délai pour laisser le temps à la vérification du statut
    
    return () => clearTimeout(timer);
  }, [isSupported, permission, loading, isSubscribed]);

  const handleEnable = async () => {
    // Masquer immédiatement le prompt pour une meilleure UX
    setShowPrompt(false);
    
    try {
      const enabled = await enableNotifications();
      if (enabled) {
        onEnabled?.();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur activation notifications:', error);
      window.alert(`Erreur: ${(error as Error).message}`);
      // En cas d'erreur, on peut réafficher le prompt
      setShowPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismissed?.();
  };

  if (!isSupported || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">Activer les notifications push</h3>
          <p className="mt-1 text-sm text-gray-500">
            {permission === 'denied' 
              ? 'Les notifications ont été refusées. Veuillez les autoriser dans les paramètres de votre navigateur pour recevoir des notifications en temps réel.'
              : 'Recevez des notifications en temps réel sur les validations, examens et mises à jour de vos dossiers.'}
          </p>
          <div className="mt-4 flex space-x-3">
            {permission === 'denied' ? (
              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Fermer
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleEnable}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Activer
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Plus tard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

