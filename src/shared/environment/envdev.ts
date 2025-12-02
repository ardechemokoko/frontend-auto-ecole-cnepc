import axios from "axios";

// URL de base de l'API
export const baseURL = "https://pajamaed-rosa-vapouringly.ngrok-free.dev/api/";

console.log('🔧 Configuration axios:', { baseURL });

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
    
    // Ajouter le header pour contourner l'avertissement ngrok
    config.headers['ngrok-skip-browser-warning'] = 'true';
    
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