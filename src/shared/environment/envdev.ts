import axios from "axios";

// URL de base de l'API
export const baseURL = "http://127.0.0.1:8000/api";

// Configuration silencieuse - les logs sont gérés par le logger utilitaire

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
    
    // Note: Le header 'ngrok-skip-browser-warning' a été retiré car il n'est pas autorisé
    // par le backend dans Access-Control-Allow-Headers. Si vous utilisez ngrok,
    // configurez le backend pour autoriser ce header dans CORS.
    
    // Pour les FormData, supprimer le Content-Type par défaut
    // pour laisser axios définir automatiquement multipart/form-data avec la boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);



export default axiosClient;