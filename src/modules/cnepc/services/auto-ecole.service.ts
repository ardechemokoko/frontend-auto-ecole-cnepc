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
  CandidatFilters,
  CandidatInscription,
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
   * L'API gère automatiquement la création de la personne associée
   */
  async createCandidat(data: any): Promise<{ success: boolean; message: string; data: Candidat }> {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 [AUTO-ECOLE SERVICE] CRÉATION D\'UN CANDIDAT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Payload envoyé à POST /candidats:');
      console.log(JSON.stringify(data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await axiosClient.post('/candidats', data);
      
      console.log('✅ [AUTO-ECOLE SERVICE] Candidat créé avec succès !');
      console.log('📄 Réponse de l\'API:', response.data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return response.data;
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [AUTO-ECOLE SERVICE] ERREUR LORS DE LA CRÉATION DU CANDIDAT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔴 Type d\'erreur:', error.name);
      console.error('🔴 Code d\'erreur:', error.code);
      console.error('🔴 Message:', error.message);
      console.error('🔴 Status HTTP:', error.response?.status);
      
      if (error.response?.data) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('📋 RÉPONSE COMPLÈTE DE L\'API:');
        console.error(JSON.stringify(error.response.data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (error.response.data.errors) {
          console.log('🔍 DÉTAILS DES ERREURS DE VALIDATION (champ par champ):');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          Object.entries(error.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const messageList = Array.isArray(messages) ? messages : [messages];
            console.error(`   ❌ Champ: "${field}"`);
            messageList.forEach((msg: string, index: number) => {
              console.error(`      ${index + 1}. ${msg}`);
            });
            console.log('   ───────────────────────────────────────────────────────────');
          });
        }
        
        if (error.response.data.message) {
          console.error('💬 Message général de l\'API:', error.response.data.message);
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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

  /**
   * Inscrit un candidat à une formation dans une auto-école
   */
  async inscrireCandidatFormation(data: {
    auto_ecole_id: string;
    formation_id: string;
    commentaires?: string;
  }): Promise<{ success: boolean; message: string; dossier: Dossier }> {
    try {
      console.log('📝 Inscription du candidat à la formation:', data);
      const response = await axiosClient.post('/candidats/inscription-formation', data);
      console.log('✅ Inscription réussie:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'inscription du candidat:', error);
      throw error;
    }
  }

  // ===== GESTION DES DOSSIERS (CANDIDATS INSCRITS) =====

  /**
   * Crée un nouveau dossier pour inscrire un candidat à une formation dans une auto-école
   */
  async createDossier(data: {
    candidat_id: string;
    auto_ecole_id: string;
    formation_id: string;
    statut?: string;
    date_creation?: string;
    commentaires?: string;
  }): Promise<{ success: boolean; message: string; data: Dossier }> {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 [AUTO-ECOLE SERVICE] CRÉATION D\'UN DOSSIER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Payload envoyé à POST /dossiers:');
      console.log(JSON.stringify(data, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await axiosClient.post('/dossiers', data);
      
      console.log('✅ [AUTO-ECOLE SERVICE] Dossier créé avec succès !');
      console.log('📄 Réponse de l\'API:', response.data);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return response.data;
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [AUTO-ECOLE SERVICE] ERREUR LORS DE LA CRÉATION DU DOSSIER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔴 Type d\'erreur:', error.name);
      console.error('🔴 Code d\'erreur:', error.code);
      console.error('🔴 Message:', error.message);
      console.error('🔴 Status HTTP:', error.response?.status);
      
      if (error.response?.data) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('📋 RÉPONSE COMPLÈTE DE L\'API:');
        console.error(JSON.stringify(error.response.data, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (error.response.data.errors) {
          console.log('🔍 DÉTAILS DES ERREURS DE VALIDATION (champ par champ):');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          Object.entries(error.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const messageList = Array.isArray(messages) ? messages : [messages];
            console.error(`   ❌ Champ: "${field}"`);
            messageList.forEach((msg: string, index: number) => {
              console.error(`      ${index + 1}. ${msg}`);
            });
            console.log('   ───────────────────────────────────────────────────────────');
          });
        }
        
        if (error.response.data.message) {
          console.error('💬 Message général de l\'API:', error.response.data.message);
        }
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw error;
    }
  }

  /**
   * Récupère tous les dossiers d'une auto-école spécifique par son ID
   * Utilisé pour afficher les dossiers d'une auto-école sélectionnée (vue admin)
   */
  async getDossiersByAutoEcoleId(autoEcoleId: string, filters?: DossierFilters): Promise<{ success: boolean; dossiers: Dossier[]; auto_ecole?: AutoEcole; statistiques?: any }> {
    try {
      const params = new URLSearchParams();
      params.append('auto_ecole_id', autoEcoleId);
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.formation_id) params.append('formation_id', filters.formation_id);
      if (filters?.candidat_id) params.append('candidat_id', filters.candidat_id);

      const queryString = params.toString();
      const endpoint = `/dossiers${queryString ? `?${queryString}` : ''}`;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [AUTO-ECOLE SERVICE] RÉCUPÉRATION DES DOSSIERS PAR ID');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏫 Auto-École ID:', autoEcoleId);
      console.log('🔗 Endpoint:', endpoint);
      console.log('🔗 URL complète:', `${axiosClient.defaults.baseURL}${endpoint}`);
      console.log('🔍 Filtres:', filters);
      console.log('🔑 Token présent:', !!localStorage.getItem('access_token'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await axiosClient.get(endpoint);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [AUTO-ECOLE SERVICE] DOSSIERS RÉCUPÉRÉS AVEC SUCCÈS !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Nombre de dossiers:', response.data.data?.length || response.data.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // L'endpoint /dossiers retourne un format différent de /auto-ecoles/mes-dossiers
      // Normaliser la réponse pour la compatibilité
      return {
        success: true,
        dossiers: response.data.data || response.data || [],
        auto_ecole: undefined, // Pas d'info auto-école dans /dossiers
        statistiques: undefined
      };
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [AUTO-ECOLE SERVICE] ERREUR LORS DE LA RÉCUPÉRATION DES DOSSIERS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔴 Status HTTP:', error.response?.status);
      console.error('🔴 Message:', error.message);
      console.error('🔴 URL appelée:', error.config?.url);
      
      if (error.response?.data) {
        console.error('📋 Réponse du backend:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw error;
    }
  }

  /**
   * Récupère tous les dossiers (candidats inscrits) de l'auto-école du responsable connecté
   */
  async getMesDossiers(filters?: DossierFilters): Promise<MesDossiersResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.formation_id) params.append('formation_id', filters.formation_id);
      if (filters?.candidat_id) params.append('candidat_id', filters.candidat_id);

      const queryString = params.toString();
      const endpoint = `/auto-ecoles/mes-dossiers${queryString ? `?${queryString}` : ''}`;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [AUTO-ECOLE SERVICE] RÉCUPÉRATION DE MES DOSSIERS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Endpoint:', endpoint);
      console.log('🔗 URL complète:', `${axiosClient.defaults.baseURL}${endpoint}`);
      console.log('🔍 Filtres:', filters);
      console.log('🔑 Token présent:', !!localStorage.getItem('access_token'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await axiosClient.get(endpoint);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [AUTO-ECOLE SERVICE] DOSSIERS RÉCUPÉRÉS AVEC SUCCÈS !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Statistiques:', response.data.statistiques);
      console.log('🏫 Auto-école:', response.data.auto_ecole?.nom_auto_ecole);
      console.log('📋 Nombre de dossiers:', response.data.dossiers?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return response.data;
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [AUTO-ECOLE SERVICE] ERREUR LORS DE LA RÉCUPÉRATION DES DOSSIERS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🔴 Status HTTP:', error.response?.status);
      console.error('🔴 Message:', error.message);
      console.error('🔴 URL appelée:', error.config?.url);
      console.error('🔴 Méthode:', error.config?.method?.toUpperCase());
      
      if (error.response?.status === 404) {
        console.error('❌ ERREUR 404 - Endpoint non trouvé !');
        console.error('💡 Vérifications à faire:');
        console.error('   1. L\'endpoint existe-t-il sur le backend ?');
        console.error('   2. Le rôle de l\'utilisateur est-il correct ? (ROLE_AUTO_ECOLE)');
        console.error('   3. L\'utilisateur est-il responsable d\'une auto-école ?');
      }
      
      if (error.response?.status === 401) {
        console.error('❌ ERREUR 401 - Non authentifié !');
        console.error('💡 Le token est peut-être expiré ou invalide');
      }
      
      if (error.response?.data) {
        console.error('📋 Réponse du backend:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw error;
    }
  }

  /**
   * Récupère un dossier par son ID
   */
  async getDossierById(id: string): Promise<Dossier> {
    try {
      const response = await axiosClient.get(`/dossiers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier:', error);
      throw error;
    }
  }

  /**
   * Met à jour un dossier existant
   */
  async updateDossier(id: string, data: Partial<DossierFormData>): Promise<{ success: boolean; message: string; data: Dossier }> {
    try {
      const response = await axiosClient.put(`/dossiers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier:', error);
      throw error;
    }
  }

  /**
   * Supprime un dossier (demande d'inscription)
   */
  async deleteDossier(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Suppression du dossier ID: ${id}...`);
      const response = await axiosClient.delete(`/dossiers/${id}`);
      console.log('✅ Dossier supprimé avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du dossier:', error);
      console.error('🔴 Status HTTP:', error.response?.status);
      console.error('🔴 Message:', error.message);
      if (error.response?.data) {
        console.error('📋 Réponse du backend:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // ===== GESTION DES FORMATIONS =====

  /**
   * Récupère les formations d'une auto-école
   */
  async getFormationsByAutoEcole(autoEcoleId: string): Promise<Formation[]> {
    try {
      const response = await axiosClient.get(`/formations?auto_ecole_id=${autoEcoleId}`);
      // La réponse peut être soit { data: [...] } soit directement un array
      return Array.isArray(response.data) ? response.data : (response.data.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les auto-écoles disponibles
   */
  async getAllAutoEcoles(): Promise<any[]> {
    try {
      console.log('🏫 Récupération de toutes les auto-écoles...');
      const response = await axiosClient.get('/auto-ecoles');
      
      // Format de réponse peut varier
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des auto-écoles:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les formations disponibles
   */
  async getAllFormations(): Promise<any[]> {
    try {
      console.log('📚 Récupération de toutes les formations...');
      const response = await axiosClient.get('/formations');
      
      // Format de réponse peut varier
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des formations:', error);
      throw error;
    }
  }

  /**
   * Récupère une formation par son ID
   */
  async getFormationById(id: string): Promise<any> {
    try {
      console.log(`📚 Récupération de la formation ID: ${id}...`);
      const response = await axiosClient.get(`/formations/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ Erreur lors de la récupération de la formation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère tous les candidats avec leurs informations complètes
   */
  async getAllCandidats(): Promise<any[]> {
    try {
      console.log('👥 Récupération de tous les candidats...');
      const response = await axiosClient.get('/candidats');
      
      // Format de réponse peut varier
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des candidats:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle formation
   */
  async createFormation(data: FormationFormData): Promise<{ success: boolean; message: string; data: Formation }> {
    try {
      const response = await axiosClient.post('/formations', data);
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
      const response = await axiosClient.put(`/formations/${id}`, data);
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
      const response = await axiosClient.get('/auto-ecoles/mes-dossiers');
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
      const response = await axiosClient.get(`/auto-ecoles/${autoEcoleId}/statistiques`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des candidats inscrits à des formations
   * Pour l'affichage dans les demandes d'inscription
   */
  async getCandidatsInscrits(): Promise<CandidatInscription[]> {
    try {
      console.log('🔄 Récupération des candidats inscrits...');
      const response = await axiosClient.get('/candidats/inscription-formation');
      
      console.log('📋 Réponse candidats inscrits:', response.data);
      
      if (response.data.success && response.data.data) {
        console.log('✅ Candidats inscrits récupérés:', response.data.data.length);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ Candidats inscrits récupérés (format array):', response.data.length);
        return response.data;
      } else {
        console.warn('⚠️ Format de réponse inattendu:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des candidats inscrits:', error);
      console.error('🔴 Status HTTP:', error.response?.status);
      console.error('🔴 Message:', error.message);
      
      if (error.response?.data) {
        console.error('📋 Réponse du backend:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  }

  /**
   * Récupère tous les dossiers de l'auto-école connectée
   */
  async getMesDossiers(): Promise<any[]> {
    try {
      console.log('📋 Récupération des dossiers de l\'auto-école connectée...');
      const response = await axiosClient.get('/auto-ecoles/mes-dossiers');
      
      console.log('✅ Réponse /auto-ecoles/mes-dossiers:', response.data);
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ Format de réponse inattendu:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des dossiers:', error);
      console.error('🔴 Status HTTP:', error.response?.status);
      console.error('🔴 Message:', error.message);
      
      if (error.response?.data) {
        console.error('📋 Réponse du backend:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  }
}

// Instance singleton du service
export const autoEcoleService = new AutoEcoleService();
