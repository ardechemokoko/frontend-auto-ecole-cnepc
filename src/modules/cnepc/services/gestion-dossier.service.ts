// Service pour la gestion de dossier
import axiosClient from '../../../shared/environment/envdev';
import {
  Dossier,
  DossierFormData,
  GestionDossierListResponse,
  GestionDossierResponse,
  GestionDossierFilters,
  GestionDossierStats,
} from '../types/gestion-dossier';

export class GestionDossierService {
  /**
   * Récupère la liste paginée de tous les dossiers
   */
  async getDossiers(
    page: number = 1,
    perPage: number = 15,
    filters?: GestionDossierFilters
  ): Promise<GestionDossierListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.statut && { statut: filters.statut }),
        ...(filters?.auto_ecole_id && { auto_ecole_id: filters.auto_ecole_id }),
        ...(filters?.formation_id && { formation_id: filters.formation_id }),
        ...(filters?.type_demande_id && { type_demande_id: filters.type_demande_id }),
        ...(filters?.date_debut && { date_debut: filters.date_debut }),
        ...(filters?.date_fin && { date_fin: filters.date_fin }),
      });

      const response = await axiosClient.get(`/dossiers?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      throw error;
    }
  }

  /**
   * Récupère un dossier par son ID
   */
  async getDossierById(id: string): Promise<Dossier> {
    try {
      const response = await axiosClient.get(`/dossiers/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau dossier
   */
  async createDossier(data: DossierFormData): Promise<GestionDossierResponse> {
    try {
      console.log('🚀 Tentative de création de dossier avec les données:', data);
      const response = await axiosClient.post('/dossiers', data);
      console.log('✅ Dossier créé avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du dossier:', error);
      console.error('📊 Détails de l\'erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 401) {
        const errorMessage =
          error.response?.data?.message ||
          'Erreur d\'authentification. Vérifiez que votre token est valide et que vous avez les permissions nécessaires.';
        throw new Error(`🔐 ${errorMessage}`);
      }

      if (error.response?.status === 403) {
        throw new Error('🚫 Accès refusé. Votre rôle ne vous permet pas de créer un dossier.');
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
   * Met à jour un dossier existant
   */
  async updateDossier(id: string, data: Partial<DossierFormData>): Promise<GestionDossierResponse> {
    try {
      const response = await axiosClient.put(`/dossiers/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Supprime un dossier
   */
  async deleteDossier(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/dossiers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des dossiers
   */
  async getDossierStats(filters?: GestionDossierFilters): Promise<GestionDossierStats> {
    try {
      const params = new URLSearchParams();
      if (filters?.auto_ecole_id) params.append('auto_ecole_id', filters.auto_ecole_id);
      if (filters?.date_debut) params.append('date_debut', filters.date_debut);
      if (filters?.date_fin) params.append('date_fin', filters.date_fin);

      const response = await axiosClient.get(`/dossiers/stats?${params}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Change le statut d'un dossier
   */
  async updateDossierStatut(
    id: string,
    statut: 'en_attente' | 'en_cours' | 'valide' | 'rejete' | 'transmis' | 'Cnepc',
    commentaires?: string
  ): Promise<GestionDossierResponse> {
    try {
      const response = await axiosClient.patch(`/dossiers/${id}/statut`, {
        statut,
        commentaires,
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
}

// Instance singleton du service
export const gestionDossierService = new GestionDossierService();

