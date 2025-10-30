import axios from "axios";

// Utiliser le proxy en développement, l'URL directe en production
const isDevelopment = import.meta.env.DEV;
const baseURL = isDevelopment 
  ? "/api/" // Proxy Vite en développement
  : "https://backend.permis.transports.gouv.ga/api/"; // URL directe en production

console.log('🔧 Configuration axios:', { isDevelopment, baseURL });

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json"
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

    }
    return config;
  },
  (error) => Promise.reject(error)
);



export default axiosClient;