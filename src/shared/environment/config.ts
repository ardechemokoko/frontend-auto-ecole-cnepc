// Configuration des environnements
export const config = {
  development: {
    apiUrl: "/api/", // Utilise le proxy Vite
    useProxy: true,
  },
  production: {
    apiUrl: "https://backend.permis.transports.gouv.ga/api/",
    useProxy: false,
  },
  staging: {
    apiUrl: "https://backend.permis.transports.gouv.ga/api/",
    useProxy: false,
  }
};

// Détection de l'environnement
export const getEnvironment = (): keyof typeof config => {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD) return 'production';
  return 'development';
};

// Configuration active
export const activeConfig = config[getEnvironment()];

// URL de base pour les requêtes API
export const getBaseURL = (): string => {
  return activeConfig.apiUrl;
};

// Vérification si on utilise le proxy
export const isUsingProxy = (): boolean => {
  return activeConfig.useProxy;
};
