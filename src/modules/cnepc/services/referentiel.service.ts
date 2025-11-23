// Service pour la gestion des référentiels
import axiosClient from '../../../shared/environment/envdev';
import { Referentiel } from '../types/auto-ecole';

// Interface pour la réponse paginée des référentiels
export interface ReferentielListResponse {
  data: Referentiel[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ReferentielFilters {
  type_ref?: string;
  statut?: boolean;
  search?: string;
}

export class ReferentielService {
  /**
   * Récupère la liste paginée de tous les référentiels
   */
  async getReferentiels(
    page: number = 1,
    perPage: number = 50,
    filters?: ReferentielFilters
  ): Promise<ReferentielListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(filters?.type_ref && { type_ref: filters.type_ref }),
        ...(filters?.statut !== undefined && { statut: filters.statut.toString() }),
        ...(filters?.search && { search: filters.search }),
      });

      const response = await axiosClient.get(`/referentiels?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des référentiels:', error);
      throw error;
    }
  }

  /**
   * Récupère un référentiel par son ID
   */
  async getReferentielById(id: string): Promise<Referentiel> {
    try {
      const response = await axiosClient.get(`/referentiels/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du référentiel:', error);
      throw error;
    }
  }

  /**
   * Récupère les référentiels par type
   */
  async getReferentielsByType(type: string): Promise<Referentiel[]> {
    try {
      const response = await this.getReferentiels(1, 100, { type_ref: type, statut: true });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des référentiels par type:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau référentiel
   */
  async createReferentiel(data: {
    libelle: string;
    code: string;
    type_ref: string;
    description?: string;
    statut: boolean;
  }): Promise<{ success: boolean; message: string; data: Referentiel }> {
    try {
      const response = await axiosClient.post('/referentiels', data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du référentiel:', error);
      throw error;
    }
  }

  /**
   * Met à jour un référentiel existant
   */
  async updateReferentiel(
    id: string,
    data: Partial<{
      libelle: string;
      code: string;
      type_ref: string;
      description: string;
      statut: boolean;
    }>
  ): Promise<{ success: boolean; message: string; data: Referentiel }> {
    try {
      const response = await axiosClient.put(`/referentiels/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du référentiel:', error);
      throw error;
    }
  }

  /**
   * Supprime un référentiel
   */
  async deleteReferentiel(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosClient.delete(`/referentiels/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du référentiel:', error);
      throw error;
    }
  }
}

// Instance singleton du service
export const referentielService = new ReferentielService();

