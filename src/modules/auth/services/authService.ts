// Service d'authentification
import { LoginRequest } from './types';

import axiosAuthentifcation from '../../../shared/environment/envauth';
import axiosClient from '../../../shared/environment/envdev';
import { Person } from '../../cnepc/forms/updateinfoAutoEcole';
import { ChangePasswordForm } from '../../eleves/types/changepassword';
import { FormDataEmail } from '../forms/LoginForm';
import { ResetPasswordFormData } from '../forms/resetpassword';

export class AuthService {
  async login(credentials: LoginRequest): Promise<any> {
    try {
      console.log('🔐 Tentative de connexion:', { email: credentials.email });

      // Utilisation de l'API d'authentification
      const response = await axiosAuthentifcation.post("/auth/login-direct", credentials);

      // Logs détaillés de l'utilisateur authentifié
      console.log('✅ Connexion réussie !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 INFORMATIONS UTILISATEUR AUTHENTIFIÉ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (response.data && response.data.user) {
        const user = response.data.user;

        console.log('📋 Identité:');
        console.log('  • ID Utilisateur:', user.id);
        console.log('  • Email:', user.email);
        console.log('  • Rôle:', user.role);
        console.log('  • Date de création:', user.created_at);

        if (user.personne) {
          console.log('\n👨‍💼 Informations Personnelles:');
          console.log('  • ID Personne:', user.personne.id);
          console.log('  • Nom:', user.personne.nom);
          console.log('  • Prénom:', user.personne.prenom);
          console.log('  • Nom complet:', user.personne.nom_complet);
          console.log('  • Email:', user.personne.email);
          console.log('  • Contact:', user.personne.contact);
          console.log('  • Adresse:', user.personne.adresse || 'Non renseignée');
        }

        console.log('\n🔑 Token:');
        console.log('  • Type:', response.data.token_type || 'Bearer');
        console.log('  • Access Token:', response.data.access_token ? `${response.data.access_token.substring(0, 30)}...` : 'N/A');
        console.log('  • Refresh Token:', response.data.refresh_token ? 'Présent' : 'Absent');
        console.log('  • Expire dans:', response.data.expires_in ? `${response.data.expires_in}s` : 'N/A');

        // Log spécifique selon le rôle
        console.log('\n🎭 RÔLE DÉTECTÉ:', user.role.toUpperCase());

        switch (user.role) {
          case 'responsable_auto_ecole':
            console.log('  ➜ Type: Responsable d\'Auto-École');
            console.log('  ➜ Permissions: Gestion des candidats, dossiers, formations');
            console.log('  ➜ Action suivante: Récupération de l\'auto-école...');
            break;
          case 'candidat':
            console.log('  ➜ Type: Candidat');
            console.log('  ➜ Permissions: Consultation de ses dossiers');
            break;
          case 'admin':
            console.log('  ➜ Type: Administrateur');
            console.log('  ➜ Permissions: Accès complet au système');
            break;
          default:
            console.log('  ➜ Type: Rôle non reconnu');
            console.warn('  ⚠️ Attention: Rôle inattendu détecté');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        console.warn('⚠️ Réponse d\'authentification incomplète');
        console.log('Réponse reçue:', response.data);
      }

      return response;
    } catch (error: any) {
      console.error('❌ ERREUR DE CONNEXION');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);

      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }

      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      throw new Error(`Erreur de connexion: ${error.message}`);
    }
  }

  async logoutBackEnd(): Promise<void> {
    try {
      await axiosClient.post("/auth/logout");
    } catch (error: any) {
      throw new Error(`Erreur de déconnexion: ${error.message}`);
    }
  }

  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      console.log('🔄 Rafraîchissement du token...');
      const response = await axiosAuthentifcation.post("/auth/refresh");
      console.log('✅ Token rafraîchi avec succès');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur de rafraîchissement du token:', error.message);
      throw new Error(`Erreur de rafraîchissement: ${error.message}`);
    }
  }

  async checkCNEPCStatus(): Promise<{ isOnline: boolean; lastCheck: string }> {
    try {
      console.log('🔍 Vérification du statut CNEPC...');
      const response = await axiosClient.get("/cnepc/status");
      console.log('✅ Statut CNEPC:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur vérification CNEPC:', error.message);
      throw new Error(`Erreur de vérification CNEPC: ${error.message}`);
    }
  }

  async updateProfile(update: Person): Promise<any> {
    try {
      const response = await axiosClient.put("/auth/update-profile", update);
      return response.data;
    } catch (e) {

    }
  }
  async changePassword(changePassword: ChangePasswordForm): Promise<any> {
    try {
      const response = await axiosClient.post("/auth/change-password", changePassword);
      return response.data;
    } catch (e) {

    }
  }

  async forgotPassword(email: FormDataEmail): Promise<any> {
    try {
     // console.log("email envoyé " + email.email)
      const response = await axiosClient.post("/auth/forgot-password",email);
      console.log(response)
      return response.data;
    } catch (e) {
     console.log(e)
    }
  }

   async resetPassword(resetpassword: ResetPasswordFormData): Promise<any> {
    try {
     // console.log("email envoyé " + email.email)
      const response = await axiosClient.post("/auth/reset-password",resetpassword);
      console.log(response)
      return response.data;
    } catch (e) {
     console.log(e)
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