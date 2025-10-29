import axios from "axios";
import { getBaseURL } from "./config";

const axiosAuthentifcation = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json"
  },
});

// Intercepteur pour les logs de débogage
axiosAuthentifcation.interceptors.request.use(
  (config) => {
    console.log('🔐 [AUTH] Requête:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ [AUTH] Erreur requête:', error);
    return Promise.reject(error);
  }
);

axiosAuthentifcation.interceptors.response.use(
  (response) => {
    console.log('✅ [AUTH] Réponse:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [AUTH] Erreur réponse:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default axiosAuthentifcation;