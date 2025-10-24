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
      
      // 🔍 DÉBOGAGE : Afficher les infos du token
      console.log('🔑 TOKEN BRUT (premiers 100 caractères):', token.substring(0, 100));
      console.log('🔑 TYPE DE TOKEN:', {
        longueur: token.length,
        commence_par: token.substring(0, 20),
        contient_points: token.split('.').length,
        format_attendu: 'JWT standard = 3 parties séparées par des points'
      });
      
      try {
        // Vérifier si c'est un JWT standard
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('✅ TOKEN JWT DÉCODÉ:', {
            user_id: payload.user_id,
            email: payload.email,
            role: payload.role,
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A',
            iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A'
          });
        } else {
          console.error('❌ Ce n\'est PAS un JWT standard !');
          console.error('Le token a', parts.length, 'parties au lieu de 3');
          console.error('Format JWT attendu: header.payload.signature');
        }
      } catch (e: any) {
        console.error('❌ Impossible de décoder le token:', e.message);
        console.error('Token invalide ou format non-standard');
      }
    } else {
      console.warn('⚠️ Aucun token trouvé dans localStorage');
      console.log('📦 localStorage keys:', Object.keys(localStorage));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour gérer les erreurs 401
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🚫 ERREUR 401 - Utilisateur non authentifié');
      console.error('📍 Endpoint:', error.config?.url);
      console.error('💬 Message backend:', error.response?.data?.message);
      
      // Vérifier si le token existe
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error('❌ Aucun token dans localStorage !');
        console.log('🔍 Clés disponibles:', Object.keys(localStorage));
      } else {
        console.log('✅ Token présent dans localStorage');
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🆔 User ID dans le token:', payload.user_id);
          console.log('📧 Email dans le token:', payload.email);
          console.warn('⚠️ PROBLÈME : Le backend ne trouve pas l\'utilisateur avec cet ID');
          console.warn('💡 SOLUTION : Vérifier que l\'utilisateur existe dans la table "users" du backend');
        } catch (e) {
          console.error('❌ Token invalide ou mal formaté');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;