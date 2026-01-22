// Service pour la gestion des utilisateurs
import axiosClient from '../../../shared/environment/envdev';
import {
  User,
  UserFormData,
  UserListResponse,
  UserFilters,
  UserStats,
} from '../types';
import { CandidatDetails, CandidatDetailsResponse, DossierDetails } from '../types/candidat-details';

export class UserService {
  /**
   * Récupère la liste paginée de tous les utilisateurs (candidats)
   */
  async getUsers(
    page: number = 1,
    perPage: number = 15,
    filters?: UserFilters
  ): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.role) {
        params.append('role', filters.role);
      }
      if (filters?.statut) {
        params.append('statut', filters.statut);
      }

      const response = await axiosClient.get(`/candidats?${params.toString()}`);
      
      // Adapter la réponse de l'endpoint /candidats au format UserListResponse
      // L'API peut retourner différents formats
      if (Array.isArray(response.data)) {
        // Si c'est un tableau direct, le transformer en format paginé
        return {
          users: response.data.map((candidat: any) => this.transformCandidatToUser(candidat)),
          total: response.data.length,
          page: 1,
          per_page: response.data.length,
          total_pages: 1,
        };
      }
      
      // Si l'API retourne un format paginé avec data
      if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          users: response.data.data.map((candidat: any) => this.transformCandidatToUser(candidat)),
          total: response.data.total || response.data.data.length,
          page: response.data.page || page,
          per_page: response.data.per_page || response.data.per_page || perPage,
          total_pages: response.data.total_pages || Math.ceil((response.data.total || response.data.data.length) / (response.data.per_page || perPage)),
        };
      }
      
      // Format par défaut
      return {
        users: [],
        total: 0,
        page: 1,
        per_page: perPage,
        total_pages: 0,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Transforme un candidat en User pour l'affichage
   */
  private transformCandidatToUser(candidat: any): User {
    return {
      id: candidat.id || candidat.user_id,
      email: candidat.personne?.email || candidat.email || '',
      role: candidat.role || 'candidat',
      telephone: candidat.personne?.telephone || candidat.telephone,
      created_at: candidat.created_at || candidat.personne?.created_at || new Date().toISOString(),
      updated_at: candidat.updated_at || candidat.personne?.updated_at || new Date().toISOString(),
      personne: candidat.personne ? {
        id: candidat.personne.id,
        nom: candidat.personne.nom || '',
        prenom: candidat.personne.prenom || '',
        email: candidat.personne.email || '',
        contact: candidat.personne.contact || '',
        telephone: candidat.personne.telephone,
        adresse: candidat.personne.adresse,
        created_at: candidat.personne.created_at || new Date().toISOString(),
        updated_at: candidat.personne.updated_at || new Date().toISOString(),
      } : undefined,
    };
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await axiosClient.get(`/candidats/${id}`);
      return this.transformCandidatToUser(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: UserFormData): Promise<User> {
    try {
      const response = await axiosClient.post('/auth/register', data);
      return response.data.user || response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`Erreur de validation: ${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, data: Partial<UserFormData>): Promise<User> {
    try {
      const response = await axiosClient.put(`/candidats/${id}`, data);
      return this.transformCandidatToUser(response.data);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        throw new Error(`Erreur de validation: ${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/candidats/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des utilisateurs
   * Note: Cette méthode retourne null car l'endpoint n'existe pas
   */
  async getUsersStats(): Promise<UserStats | null> {
    // L'endpoint /candidats/stats n'existe probablement pas
    // On retourne null pour ne pas générer d'erreur
    return null;
  }

  /**
   * Récupère les détails complets d'un candidat
   */
  async getCandidatDetails(id: string): Promise<CandidatDetails> {
    try {
      const response = await axiosClient.get<CandidatDetailsResponse>(`/candidats/${id}`);
      
      console.log('📋 Réponse complète de /candidats/{id}:', response.data);
      
      let candidatData: any;
      
      // Si la réponse a un format { success: true, data: {...} }
      if (response.data.success && response.data.data) {
        candidatData = response.data.data;
      } else if (response.data.data) {
        // Format direct avec data
        candidatData = response.data.data;
      } else {
        // Si la réponse est directement les données
        candidatData = response.data;
      }
      
      console.log('📋 Données du candidat:', candidatData);
      console.log('📋 Dossiers du candidat (avant enrichissement):', candidatData.dossiers);
      
      // Si les dossiers ne sont pas présents ou vides, les récupérer séparément
      if (!candidatData.dossiers || !Array.isArray(candidatData.dossiers) || candidatData.dossiers.length === 0) {
        console.log('⚠️ Aucun dossier dans la réponse, récupération via /dossiers?candidat_id=');
        try {
          const dossiersResponse = await axiosClient.get(`/dossiers?candidat_id=${id}&per_page=1000`);
          
          // Gérer différents formats de réponse
          let dossiers: DossierDetails[] = [];
          if (Array.isArray(dossiersResponse.data)) {
            dossiers = dossiersResponse.data;
          } else if (dossiersResponse.data?.data && Array.isArray(dossiersResponse.data.data)) {
            dossiers = dossiersResponse.data.data;
          } else if (dossiersResponse.data?.dossiers && Array.isArray(dossiersResponse.data.dossiers)) {
            dossiers = dossiersResponse.data.dossiers;
          }
          
          console.log(`✅ ${dossiers.length} dossiers récupérés via /dossiers`);
          candidatData.dossiers = dossiers;
        } catch (dossiersError) {
          console.warn('⚠️ Impossible de récupérer les dossiers séparément:', dossiersError);
          candidatData.dossiers = [];
        }
      }
      
      // S'assurer que les dossiers sont bien présents et structurés
      if (candidatData.dossiers && Array.isArray(candidatData.dossiers)) {
        console.log(`✅ ${candidatData.dossiers.length} dossiers trouvés au total`);
        candidatData.dossiers.forEach((dossier: any, index: number) => {
          console.log(`📁 Dossier ${index + 1}:`, {
            id: dossier.id,
            type_demande_id: dossier.type_demande_id,
            has_type_demande: !!dossier.type_demande,
            type_demande_name: dossier.type_demande?.name,
            statut: dossier.statut,
            has_auto_ecole: !!dossier.auto_ecole,
            has_formation: !!dossier.formation,
            documents_count: dossier.documents?.length || 0,
          });
          
          // Si type_demande n'est pas présent mais type_demande_id l'est, on peut essayer de le charger
          // Mais pour l'instant, on laisse tel quel car cela devrait être inclus dans la réponse
        });
      } else {
        console.warn('⚠️ Format de dossiers incorrect');
        candidatData.dossiers = [];
      }
      
      return candidatData as CandidatDetails;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du candidat:', error);
      throw error;
    }
  }
}

export const userService = new UserService();

