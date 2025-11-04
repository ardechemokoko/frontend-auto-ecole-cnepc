import axios, { AxiosInstance,  AxiosResponse } from 'axios';
import { API_CONFIG } from '../constants/api';

// Configuration axios centralisée
class AxiosConfig {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Intercepteur pour les requêtes
    this.instance.interceptors.request.use(
      (config) => {
        // Ajouter le token d'authentification si disponible
        // Essayer d'abord avec access_token (utilisé par l'API), puis auth_token (fallback)
        let token = localStorage.getItem('access_token');
        if (!token) {
          token = localStorage.getItem('auth_token');
        }
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour les réponses
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et pas déjà tenté de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { token, refreshToken: newRefreshToken } = response.data;
              
              // Sauvegarder le nouveau token dans les deux clés pour compatibilité
              localStorage.setItem('access_token', token);
              localStorage.setItem('auth_token', token);
              
              // Sauvegarder le nouveau refresh token si présent
              if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken);
              }

              // Retry la requête originale avec le nouveau token
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token invalide, nettoyer et rediriger vers login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

export default new AxiosConfig().getInstance();
