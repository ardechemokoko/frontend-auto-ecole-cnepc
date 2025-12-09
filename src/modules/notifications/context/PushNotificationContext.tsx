import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

type PushNotificationContextValue = ReturnType<typeof usePushNotifications> & {
  isSubscribed: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
};

const PushNotificationContext = createContext<PushNotificationContextValue | undefined>(undefined);

export const PushNotificationProvider = ({ children }: { children: ReactNode }) => {
  const pushNotifications = usePushNotifications();
  const { isSupported, loading, checkSubscriptionStatus, subscribe, unsubscribe } = pushNotifications;
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isSupported || loading) {
      return;
    }

    let mounted = true;

    checkSubscriptionStatus().then((status) => {
      if (mounted) {
        const subscribed = Boolean(status.subscribed);
        setIsSubscribed(subscribed);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isSupported, loading, checkSubscriptionStatus]);

  const enableNotifications = useCallback(async () => {
    try {
      await subscribe();
      // Vérifier le statut après souscription pour confirmer
      const status = await checkSubscriptionStatus();
      const subscribed = Boolean(status.subscribed);
      setIsSubscribed(subscribed);
      
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur activation notifications:', error);
      return false;
    }
  }, [subscribe, checkSubscriptionStatus]);

  const disableNotifications = useCallback(async () => {
    try {
      await unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur désactivation notifications:', error);
      return false;
    }
  }, [unsubscribe]);

  const value = useMemo(
    () => ({
      ...pushNotifications,
      isSubscribed,
      enableNotifications,
      disableNotifications,
    }),
    [pushNotifications, isSubscribed, enableNotifications, disableNotifications],
  );

  return <PushNotificationContext.Provider value={value}>{children}</PushNotificationContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePushNotificationContext = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotificationContext must be used within PushNotificationProvider');
  }
  return context;
};

