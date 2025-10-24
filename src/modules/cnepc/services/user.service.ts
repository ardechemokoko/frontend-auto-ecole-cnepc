import axiosClient from '../../../shared/utils/axiosConfig';

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
    try {
      console.log('🚀 Création d\'un nouvel utilisateur:', data);
      const response = await axiosClient.post('/auth/register', data);
      console.log('✅ Utilisateur créé avec succès:', response.data);
      
      // 🔍 DÉBOGAGE : Vérifier l'ID retourné
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
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(`📝 Erreur de validation: ${errorMessages}`);
        }
      }
      
      if (error.response?.data?.message) {
        throw new Error(`⚠️ ${error.response.data.message}`);
      }
      
      throw new Error(`❌ Erreur inattendue: ${error.message}`);
    }
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
