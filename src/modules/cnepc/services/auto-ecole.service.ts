// Service pour la gestion des auto-écoles
import axiosClient from '../../../shared/environment/envdev';
import {
  AutoEcole,
  AutoEcoleFormData,
  AutoEcoleResponse,
  AutoEcoleListResponse,
  MesDossiersResponse,
  Candidat,
  CandidatFormData,
  CandidatListResponse,
  Formation,
  FormationFormData,
  Dossier,
  DossierFormData,
  AutoEcoleFilters,
  DossierFilters,
  CandidatFilters
} from '../types/auto-ecole';

export class AutoEcoleService {
  // ===== GESTION DES AUTO-ÉCOLES =====

  /**
   * Récupère la liste paginée de toutes les auto-écoles
   */
  async getAutoEcoles(page: number = 1, perPage: number = 15, filters?: AutoEcoleFilters): Promise<AutoEcoleListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.statut !== undefined && { statut: filters.statut.toString() }),
        ...(filters?.responsable_id && { responsable_id: filters.responsable_id }),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await axiosClient.get(`/auto-ecoles?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des auto-écoles:', error);
      throw error;
    }
  }

  /**
   * Récupère une auto-école par son ID
   */
  async getAutoEcoleById(id: string): Promise<AutoEcole> {
    try {
      const response = await axiosClient.get(`/auto-ecoles/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'auto-école:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle auto-école
   */
  async createAutoEcole(data: AutoEcoleFormData): Promise<AutoEcoleResponse> {
    try {
      console.log('🚀 Tentative de création d\'auto-école avec les données:', data);
      const response = await axiosClient.post('/auto-ecoles', data);
      console.log('✅ Auto-école créée avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de l\'auto-école:', error);
      console.error('📊 Détails de l\'erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Gestion spécifique des erreurs d'authentification
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 
          'Erreur d\'authentification. Vérifiez que votre token est valide et que vous avez les permissions nécessaires.';
        throw new Error(`🔐 ${errorMessage}`);
      }
      
      if (error.response?.status === 403) {
        throw new Error('🚫 Accès refusé. Votre rôle ne vous permet pas de créer une auto-école.');
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
   * Met à jour une auto-école existante
   */
  async updateAutoEcole(id: string, data: Partial<AutoEcoleFormData>): Promise<AutoEcoleResponse> {
    try {
      const response = await axiosClient.put(`/auto-ecoles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'auto-école:', error);
      throw error;
    }
  }

  /**
   * Supprime une auto-école
   */
  async deleteAutoEcole(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/auto-ecoles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'auto-école:', error);
      throw error;
    }
  }

  // ===== GESTION DES CANDIDATS =====

  /**
   * Récupère la liste paginée de tous les candidats
   */
  async getCandidats(page: number = 1, perPage: number = 15, filters?: CandidatFilters): Promise<CandidatListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.nationalite && { nationalite: filters.nationalite }),
        ...(filters?.genre && { genre: filters.genre }),
        ...(filters?.statut && { statut: filters.statut }),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await axiosClient.get(`/candidats?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des candidats:', error);
      throw error;
    }
  }

  /**
   * Récupère un candidat par son ID
   */
  async getCandidatById(id: string): Promise<Candidat> {
    try {
      const response = await axiosClient.get(`/candidats/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du candidat:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau candidat
   */
  async createCandidat(data: CandidatFormData): Promise<{ success: boolean; message: string; data: Candidat }> {
    try {
      const response = await axiosClient.post('/candidats', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du candidat:', error);
      throw error;
    }
  }

  /**
   * Met à jour un candidat existant
   */
  async updateCandidat(id: string, data: Partial<CandidatFormData>): Promise<{ success: boolean; message: string; data: Candidat }> {
    try {
      const response = await axiosClient.put(`/candidats/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du candidat:', error);
      throw error;
    }
  }

  // ===== GESTION DES DOSSIERS (CANDIDATS INSCRITS) =====

  /**
   * Récupère tous les dossiers (candidats inscrits) de l'auto-école du responsable connecté
   */
  async getMesDossiers(filters?: DossierFilters): Promise<MesDossiersResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.formation_id) params.append('formation_id', filters.formation_id);
      if (filters?.candidat_id) params.append('candidat_id', filters.candidat_id);

      const response = await axiosClient.get(`/api/auto-ecoles/mes-dossiers?${params}`);
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
      const response = await axiosClient.get(`/api/dossiers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau dossier de candidature
   */
  async createDossier(data: DossierFormData): Promise<{ success: boolean; message: string; data: Dossier }> {
    try {
      const response = await axiosClient.post('/api/dossiers', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw error;
    }
  }

  /**
   * Met à jour un dossier existant
   */
  async updateDossier(id: string, data: Partial<DossierFormData>): Promise<{ success: boolean; message: string; data: Dossier }> {
    try {
      const response = await axiosClient.put(`/api/dossiers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      throw error;
    }
  }

  // ===== GESTION DES FORMATIONS =====

  /**
   * Récupère les formations d'une auto-école
   */
  async getFormationsByAutoEcole(autoEcoleId: string): Promise<Formation[]> {
    try {
      const response = await axiosClient.get(`/api/formations?auto_ecole_id=${autoEcoleId}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle formation
   */
  async createFormation(data: FormationFormData): Promise<{ success: boolean; message: string; data: Formation }> {
    try {
      const response = await axiosClient.post('/api/formations', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la formation:', error);
      throw error;
    }
  }

  /**
   * Met à jour une formation existante
   */
  async updateFormation(id: string, data: Partial<FormationFormData>): Promise<{ success: boolean; message: string; data: Formation }> {
    try {
      const response = await axiosClient.put(`/api/formations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la formation:', error);
      throw error;
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Vérifie si l'utilisateur connecté est responsable d'une auto-école
   */
  async checkAutoEcoleResponsable(): Promise<boolean> {
    try {
      const response = await axiosClient.get('/api/auto-ecoles/mes-dossiers');
      return response.data.success;
    } catch (error) {
      console.error('Erreur lors de la vérification du responsable:', error);
      return false;
    }
  }

  /**
   * Récupère les statistiques d'une auto-école
   */
  async getAutoEcoleStats(autoEcoleId: string): Promise<{
    total_candidats: number;
    dossiers_en_attente: number;
    dossiers_en_cours: number;
    dossiers_valides: number;
    dossiers_rejetes: number;
  }> {
    try {
      const response = await axiosClient.get(`/api/auto-ecoles/${autoEcoleId}/statistiques`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
}

// Instance singleton du service
export const autoEcoleService = new AutoEcoleService();
