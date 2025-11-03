import axiosAuthentifcation from '../../../shared/environment/envauth';
import axiosClient from '../../../shared/environment/envdev';

export interface UserFormData {
  email: string;
  password: string;
  password_confirmation: string;
  nom: string;
  prenom: string;
  contact: string;
  adresse?: string;
  role: 'candidat' | 'responsable_auto_ecole' | 'admin';
}

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  personne?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    contact: string;
    adresse: string;
  };
}

export interface UserResponse {
  success: boolean;
  message: string;
  user?: User;
  auth_url?: string;
}

export class UserService {
  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: UserFormData): Promise<UserResponse> {
    const attempts = [0, 1000, 2000, 4000]; // 3 retries avec backoff
    let lastError: any = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        if (i > 0) {
          await new Promise((res) => setTimeout(res, attempts[i]));
        }
        console.log('🚀 Création d\'un nouvel utilisateur (tentative', i + 1, '):', data);
        // Désactiver le timeout pour laisser l'API répondre si elle est lente
        const response = await axiosAuthentifcation.post('/auth/register', data, { timeout: 0 });
        console.log('✅ Utilisateur créé avec succès:', response.data);

        if (response.data.user?.id) {
          console.log('🆔 ID de l\'utilisateur créé:', response.data.user.id);
          console.log('📧 Email:', response.data.user.email);
          console.log('🎭 Rôle:', response.data.user.role);
          console.log('⚠️ IMPORTANT: Utilisez CET ID pour créer l\'auto-école');
        } else {
          console.warn('⚠️ Aucun ID d\'utilisateur dans la réponse !');
          console.log('📦 Réponse complète:', JSON.stringify(response.data, null, 2));
        }
        return response.data;
      } catch (error: any) {
        lastError = error;
        console.error('❌ Tentative', i + 1, 'échouée:', error?.message || error);
        // Si 422, inutile de réessayer
        if (error?.response?.status === 422) break;
      }
    }

    const error: any = lastError;
    console.error('❌ Erreur finale lors de la création de l\'utilisateur:', error);

    if (error?.response?.status === 422) {
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`📝 Erreur de validation: ${errorMessages}`);
      }
    }

    if (error?.code === 'ECONNABORTED') {
      throw new Error('⏱️ Temps d\'attente dépassé lors de la création de l\'utilisateur. Veuillez réessayer.');
    }

    if (error?.response?.data?.message) {
      throw new Error(`⚠️ ${error.response.data.message}`);
    }

    if (error?.message === 'Network Error') {
      throw new Error('🌐 Erreur réseau: impossible de joindre le serveur. Vérifiez votre connexion ou l\'API.');
    }

    throw new Error(`❌ Erreur inattendue: ${error?.message || 'inconnue'}`);
  }

  /**
   * Récupère la liste des utilisateurs
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await axiosClient.get('/users');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await axiosClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, data: Partial<UserFormData>): Promise<UserResponse> {
    try {
      const response = await axiosClient.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
