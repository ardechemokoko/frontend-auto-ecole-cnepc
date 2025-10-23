// Service d'authentification avec mocks
import { LoginRequest, AuthResponse } from './types';
import { loginMock, logoutMock, refreshTokenMock, checkCNEPCStatusMock } from './auth.service';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Utilisation du mock pour le développement
      return await loginMock(credentials);
    } catch (error: any) {
      throw new Error(`Erreur de connexion: ${error.message}`);
    }
  }

  async logout(): Promise<void> {
    try {
      // Utilisation du mock pour le développement
      await logoutMock();
    } catch (error: any) {
      throw new Error(`Erreur de déconnexion: ${error.message}`);
    }
  }

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      // Utilisation du mock pour le développement
      return await refreshTokenMock();
    } catch (error: any) {
      throw new Error(`Erreur de rafraîchissement: ${error.message}`);
    }
  }

  async checkCNEPCStatus(): Promise<{ isOnline: boolean; lastCheck: string }> {
    try {
      // Utilisation du mock pour le développement
      return await checkCNEPCStatusMock();
    } catch (error: any) {
      throw new Error(`Erreur de vérification CNEPC: ${error.message}`);
    }
  }
}

export const authService = new AuthService();

// Version API future (préparée mais commentée)
// import { apiClient } from '../../../shared/utils/axiosConfig';
// import { API_ENDPOINTS } from '../../../shared/constants/api';

// export class AuthService {
//   async login(credentials: LoginRequest): Promise<AuthResponse> {
//     try {
//       const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
//       return response.data;
//     } catch (error: any) {
//       throw new Error(`Erreur de connexion: ${error.response?.data?.message || error.message}`);
//     }
//   }
//   // ... autres méthodes API
// }