// Service pour la gestion des types de demande
import axiosClient from '../../../shared/environment/envdev';
import {
  TypeDemande,
  TypeDemandeFormData,
  TypeDemandeResponse,
  TypeDemandeListResponse,
  TypeDemandeFilters,
} from '../types/type-demande';

export class TypeDemandeService {
  /**
   * Récupère la liste paginée de tous les types de demande
   */
  async getTypeDemandes(
    page: number = 1,
    perPage: number = 15,
    filters?: TypeDemandeFilters
  ): Promise<TypeDemandeListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await axiosClient.get(`/type-demandes?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de demande:', error);
      throw error;
    }
  }

  /**
   * Récupère un type de demande par son ID
   */
  async getTypeDemandeById(id: string): Promise<TypeDemande> {
    try {
      const response = await axiosClient.get(`/type-demandes/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du type de demande:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau type de demande
   */
  async createTypeDemande(data: TypeDemandeFormData): Promise<TypeDemandeResponse> {
    try {
      console.log('🚀 Tentative de création de type de demande avec les données:', data);
      const response = await axiosClient.post('/type-demandes', data);
      console.log('✅ Type de demande créé avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du type de demande:', error);
      console.error('📊 Détails de l\'erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        const errorMessage =
          error.response?.data?.message ||
          'Erreur d\'authentification. Vérifiez que votre token est valide et que vous avez les permissions nécessaires.';
        throw new Error(`🔐 ${errorMessage}`);
      }

      if (error.response?.status === 403) {
        throw new Error('🚫 Accès refusé. Votre rôle ne vous permet pas de créer un type de demande.');
      }

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
   * Met à jour un type de demande existant
   */
  async updateTypeDemande(id: string, data: Partial<TypeDemandeFormData>): Promise<TypeDemandeResponse> {
    try {
      const response = await axiosClient.put(`/type-demandes/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du type de demande:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Supprime un type de demande
   */
  async deleteTypeDemande(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/type-demandes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du type de demande:', error);
      throw error;
    }
  }
}

// Instance singleton du service
export const typeDemandeService = new TypeDemandeService();

