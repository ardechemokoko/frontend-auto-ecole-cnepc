// Service pour la gestion des pièces justificatives
import axiosClient from '../../../shared/environment/envdev';
import {
  PieceJustificative,
  PieceJustificativeFormData,
  PieceJustificativeResponse,
  PieceJustificativeListResponse,
  PieceJustificativeFilters,
} from '../types/piece-justificative';

export class PieceJustificativeService {
  /**
   * Récupère la liste paginée de toutes les pièces justificatives
   */
  async getPiecesJustificatives(
    page: number = 1,
    perPage: number = 15,
    filters?: PieceJustificativeFilters
  ): Promise<PieceJustificativeListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.etape_id && { etape_id: filters.etape_id }),
        ...(filters?.type_document_id && { type_document_id: filters.type_document_id }),
        ...(filters?.obligatoire !== undefined && { obligatoire: filters.obligatoire.toString() }),
      });

      const response = await axiosClient.get(`/pieces-justificatives?${params}`);
      
      // Gérer différentes structures de réponse
      const responseData = response.data;
      console.log('📦 Réponse API pièces justificatives:', responseData);
      
      // Si la réponse est directement un tableau
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          links: {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
          meta: {
            current_page: page,
            from: 1,
            last_page: 1,
            path: '/pieces-justificatives',
            per_page: perPage,
            to: responseData.length,
            total: responseData.length,
          },
        };
      }
      
      // Si la réponse a la structure attendue avec data et meta
      if (responseData.data && responseData.meta) {
        return responseData;
      }
      
      // Si la réponse a data mais pas meta, créer une structure par défaut
      if (responseData.data && Array.isArray(responseData.data)) {
        return {
          data: responseData.data,
          links: responseData.links || {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
          meta: responseData.meta || {
            current_page: page,
            from: 1,
            last_page: 1,
            path: '/pieces-justificatives',
            per_page: perPage,
            to: responseData.data.length,
            total: responseData.data.length,
          },
        };
      }
      
      // Structure inattendue, retourner une structure vide
      console.warn('Structure de réponse inattendue:', responseData);
      return {
        data: [],
        links: {
          first: '',
          last: '',
          prev: null,
          next: null,
        },
        meta: {
          current_page: page,
          from: 0,
          last_page: 1,
          path: '/pieces-justificatives',
          per_page: perPage,
          to: 0,
          total: 0,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces justificatives:', error);
      throw error;
    }
  }

  /**
   * Récupère une pièce justificative par son ID
   */
  async getPieceJustificativeById(id: string): Promise<PieceJustificative> {
    try {
      const response = await axiosClient.get(`/pieces-justificatives/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la pièce justificative:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle pièce justificative
   */
  async createPieceJustificative(data: PieceJustificativeFormData): Promise<PieceJustificativeResponse> {
    try {
      console.log('🚀 Tentative de création de pièce justificative avec les données:', data);
      const response = await axiosClient.post('/pieces-justificatives', data);
      console.log('✅ Pièce justificative créée avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de la pièce justificative:', error);
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
        throw new Error('🚫 Accès refusé. Votre rôle ne vous permet pas de créer une pièce justificative.');
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
   * Met à jour une pièce justificative existante
   */
  async updatePieceJustificative(id: string, data: Partial<PieceJustificativeFormData>): Promise<PieceJustificativeResponse> {
    try {
      const response = await axiosClient.put(`/pieces-justificatives/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la pièce justificative:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Supprime une pièce justificative
   */
  async deletePieceJustificative(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/pieces-justificatives/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce justificative:', error);
      throw error;
    }
  }
}

// Instance singleton du service
export const pieceJustificativeService = new PieceJustificativeService();

