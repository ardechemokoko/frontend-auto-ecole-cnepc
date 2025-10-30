// Service d'authentification
import { LoginRequest } from './types';

import axiosAuthentifcation from '../../../shared/environment/envauth';
import axiosClient from '../../../shared/environment/envdev';
import { Person } from '../../cnepc/forms/updateinfoAutoEcole';
import { ChangePasswordForm } from '../../eleves/types/changepassword';
import { FormDataEmail } from '../forms/LoginForm';
import { ResetPasswordFormData } from '../forms/resetpassword';
import { AutoEcoleListApiResponse, AutoEcoleDetailResponse } from '../../cnepc/types/auto-ecole';

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

  async register(data: {
    email: string;
    password: string;
    password_confirmation: string;
    nom: string;
    prenom: string;
    contact: string;
    adresse?: string;
    role: string;
  }): Promise<any> {
    try {
      console.log('📝 Tentative d\'enregistrement:', { 
        email: data.email, 
        nom: data.nom, 
        prenom: data.prenom, 
        role: data.role 
      });
      
      const response = await axiosAuthentifcation.post("/auth/register", data);
      
      console.log('✅ Enregistrement réussi !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 NOUVEL UTILISATEUR CRÉÉ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        
        console.log('📋 Identité:');
        console.log('  • ID Utilisateur:', user.id);
        console.log('  • Email:', user.email);
        console.log('  • Rôle:', user.role);
        
        if (user.personne) {
          console.log('\n👨‍💼 Informations Personnelles:');
          console.log('  • ID Personne:', user.personne.id);
          console.log('  • Nom:', user.personne.nom);
          console.log('  • Prénom:', user.personne.prenom);
          console.log('  • Contact:', user.personne.contact);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR D\'ENREGISTREMENT');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw error;
    }
  }

  // async register(data: {
  //   email: string;
  //   password: string;
  //   password_confirmation: string;
  //   nom: string;
  //   prenom: string;
  //   contact: string;
  //   adresse?: string;
  //   role: string;
  // }): Promise<any> {
  //   try {
  //     console.log('📝 Tentative d\'enregistrement:', { 
  //       email: data.email, 
  //       nom: data.nom, 
  //       prenom: data.prenom, 
  //       role: data.role 
  //     });
      
  //     const response = await axiosAuthentifcation.post("/auth/register", data);
      
  //     console.log('✅ Enregistrement réussi !');
  //     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  //     console.log('👤 NOUVEL UTILISATEUR CRÉÉ');
  //     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
  //     if (response.data && response.data.user) {
  //       const user = response.data.user;
        
  //       console.log('📋 Identité:');
  //       console.log('  • ID Utilisateur:', user.id);
  //       console.log('  • Email:', user.email);
  //       console.log('  • Rôle:', user.role);
        
  //       if (user.personne) {
  //         console.log('\n👨‍💼 Informations Personnelles:');
  //         console.log('  • ID Personne:', user.personne.id);
  //         console.log('  • Nom:', user.personne.nom);
  //         console.log('  • Prénom:', user.personne.prenom);
  //         console.log('  • Contact:', user.personne.contact);
  //       }
        
  //       console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  //     }
      
  //     return response.data;
  //   } catch (error: any) {
  //     console.error('❌ ERREUR D\'ENREGISTREMENT');
  //     console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  //     console.error('Message:', error.message);
      
  //     if (error.response) {
  //       console.error('Statut HTTP:', error.response.status);
  //       console.error('Données:', error.response.data);
  //     }
      
  //     console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
  //     throw error;
  //   }
  // }

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
      console.log(e)
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
      const response = await axiosClient.post("/auth/forgot-password", email);
      console.log(response)
      return response.data;
    } catch (e) {
      console.log(e)
    }
  }

  async resetPassword(resetpassword: ResetPasswordFormData): Promise<any> {
    try {
      // console.log("email envoyé " + email.email)
      const response = await axiosClient.post("/auth/reset-password", resetpassword);
      console.log(response)
      return response.data;
    } catch (e) {
      console.log(e)
    }
  }

  async getCurrentUser(token: string): Promise<any> {
    try {
      console.log('🔍 Vérification du rôle utilisateur via /auth/me...');
      
      const response = await axiosClient.get("/auth/me", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Informations utilisateur récupérées avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 INFORMATIONS UTILISATEUR ACTUEL');
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
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA VÉRIFICATION DU RÔLE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la vérification du rôle: ${error.message}`);
    }
  }

  async getAllAutoEcoles(token: string): Promise<AutoEcoleListApiResponse> {
    try {
      console.log('🏫 Récupération de toutes les auto-écoles...');
      
      const response = await axiosClient.get("/auto-ecoles", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Liste des auto-écoles récupérée avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏫 AUTO-ÉCOLES DISPONIBLES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.data) {
        console.log('📋 Nombre d\'auto-écoles:', response.data.data.length);
        
        response.data.data.forEach((autoEcole: any, index: number) => {
          console.log(`\n${index + 1}. ${autoEcole.nom_auto_ecole}`);
          console.log('   • ID:', autoEcole.id);
          console.log('   • Adresse:', autoEcole.adresse);
          console.log('   • Email:', autoEcole.email);
          console.log('   • Contact:', autoEcole.contact);
          console.log('   • Statut:', autoEcole.statut_libelle);
          console.log('   • Responsable:', autoEcole.responsable?.nom_complet || 'N/A');
          console.log('   • ID Responsable:', autoEcole.responsable_id);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DES AUTO-ÉCOLES');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération des auto-écoles: ${error.message}`);
    }
  }

  async getAutoEcoleById(id: string, token: string): Promise<AutoEcoleDetailResponse> {
    try {
      console.log(`🏫 Récupération des détails de l'auto-école ID: ${id}...`);
      
      const response = await axiosClient.get(`/auto-ecoles/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Détails de l\'auto-école récupérés avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏫 DÉTAILS AUTO-ÉCOLE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.success && response.data.data) {
        const autoEcole = response.data.data;
        
        console.log('📋 Informations générales:');
        console.log('  • ID:', autoEcole.id);
        console.log('  • Nom:', autoEcole.nom_auto_ecole);
        console.log('  • Adresse:', autoEcole.adresse);
        console.log('  • Email:', autoEcole.email);
        console.log('  • Contact:', autoEcole.contact);
        console.log('  • Statut:', autoEcole.statut_libelle);
        console.log('  • ID Responsable:', autoEcole.responsable_id);
        
        if (autoEcole.responsable) {
          console.log('\n👨‍💼 Responsable:');
          console.log('  • ID:', autoEcole.responsable.id);
          console.log('  • Nom complet:', autoEcole.responsable.nom_complet);
          console.log('  • Email:', autoEcole.responsable.email);
          console.log('  • Contact:', autoEcole.responsable.contact);
        }
        
        if (autoEcole.formations && autoEcole.formations.length > 0) {
          console.log('\n📚 Formations disponibles:');
          autoEcole.formations.forEach((formation: any, index: number) => {
            console.log(`  ${index + 1}. ${formation.type_permis?.libelle || 'Formation'} - ${formation.montant_formate || 'N/A'}`);
          });
        }
        
        if (autoEcole.dossiers && autoEcole.dossiers.length > 0) {
          console.log('\n📁 Dossiers:');
          console.log('  • Nombre total:', autoEcole.dossiers.length);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DES DÉTAILS AUTO-ÉCOLE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération des détails auto-école: ${error.message}`);
    }
  }

  async findAutoEcoleByResponsableId(responsableId: string, token: string): Promise<AutoEcoleDetailResponse | null> {
    try {
      console.log(`🔍 Recherche de l'auto-école pour le responsable ID: ${responsableId}...`);
      
      // Récupérer toutes les auto-écoles
      const autoEcolesResponse = await this.getAllAutoEcoles(token);
      
      // Chercher l'auto-école correspondant au responsable
      const autoEcole = autoEcolesResponse.data.find(ae => ae.responsable_id === responsableId);
      
      if (!autoEcole) {
        console.log('⚠️ Aucune auto-école trouvée pour ce responsable');
        return null;
      }
      
      console.log(`✅ Auto-école trouvée: ${autoEcole.nom_auto_ecole} (ID: ${autoEcole.id})`);
      
      // Récupérer les détails complets de l'auto-école
      return await this.getAutoEcoleById(autoEcole.id, token);
      
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RECHERCHE AUTO-ÉCOLE PAR RESPONSABLE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la recherche auto-école par responsable: ${error.message}`);
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