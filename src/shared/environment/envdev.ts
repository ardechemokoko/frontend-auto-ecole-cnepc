import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://api.artech-agency.site/api/",
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

// // Intercepteur de réponse pour gérer les erreurs 401
// axiosClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       console.error('🚫 ERREUR 401 - Utilisateur non authentifié');
//       console.error('📍 Endpoint:', error.config?.url);
//       console.error('💬 Message backend:', error.response?.data?.message);

//       // Vérifier si le token existe
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         console.error('❌ Aucun token dans localStorage !');
//         console.log('🔍 Clés disponibles:', Object.keys(localStorage));
//       } else {
//         console.log('✅ Token présent dans localStorage');
//         try {
//           const payload = JSON.parse(atob(token.split('.')[1]));
//           console.log('🆔 User ID dans le token:', payload.user_id);
//           console.log('📧 Email dans le token:', payload.email);
//           console.warn('⚠️ PROBLÈME : Le backend ne trouve pas l\'utilisateur avec cet ID');
//           console.warn('💡 SOLUTION : Vérifier que l\'utilisateur existe dans la table "users" du backend');
//         } catch (e) {
//           console.error('❌ Token invalide ou mal formaté');
//         }
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosClient;