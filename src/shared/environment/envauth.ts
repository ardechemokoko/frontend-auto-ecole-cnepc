import axios from "axios";

// Utiliser le proxy en développement, l'URL directe en production
const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment 
  ? "/api/" // Proxy Vite en développement
  : "https://backend.permis.transports.gouv.ga/api/"; // URL directe en production

console.log('🔧 Configuration axios (auth):', { isDevelopment, baseURL });

const axiosAuthentifcation = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json"
  },
});

export default axiosAuthentifcation;