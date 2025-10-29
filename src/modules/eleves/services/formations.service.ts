// Service pour la gestion des formations
import axiosClient from '../../../shared/environment/envdev';

// Types pour les formations
export interface FormationApiResponse {
  success: boolean;
  message: string;
  data: FormationApiItem;
}

export interface FormationListApiResponse {
  data: FormationApiItem[];
  links: {
    first: string;
    last: string;
    prev: string;
    next: string;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface FormationApiItem {
  id: string;
  auto_ecole_id: string;
  type_permis_id: string;
  montant: number;
  montant_formate: string;
  description: string;
  session_id: string;
  statut: boolean;
  statut_libelle: string;
  auto_ecole: {
    id: string;
    nom_auto_ecole: string;
    adresse: string;
    email: string;
    responsable_id: string;
    contact: string;
    statut: boolean;
    statut_libelle: string;
    responsable: {
      id: string;
      utilisateur_id: string;
      nom: string;
      prenom: string;
      nom_complet: string;
      email: string;
      contact: string;
      adresse: string;
      created_at: string;
      updated_at: string;
    };
    formations: any[];
    dossiers: any[];
    created_at: string;
    updated_at: string;
  };
  type_permis: {
    id: string;
    libelle: string;
    code: string;
    type_ref: string;
    description: string;
    statut: boolean;
    statut_libelle: string;
    created_at: string;
    updated_at: string;
  };
  session: {
    id: string;
    libelle: string;
    code: string;
    type_ref: string;
    description: string;
    statut: boolean;
    statut_libelle: string;
    created_at: string;
    updated_at: string;
  };
  dossiers: any[];
  created_at: string;
  updated_at: string;
}

export class FormationsService {
  /**
   * Récupère toutes les formations
   */
  async getAllFormations(token: string, page: number = 1, perPage: number = 50): Promise<FormationListApiResponse> {
    try {
      console.log('📚 Récupération de toutes les formations...');
      
      const response = await axiosClient.get(`/formations?page=${page}&per_page=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Formations récupérées avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 FORMATIONS DISPONIBLES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.data) {
        console.log('📋 Nombre de formations:', response.data.data.length);
        
        response.data.data.forEach((formation: FormationApiItem, index: number) => {
          console.log(`\n${index + 1}. ${formation.type_permis.libelle}`);
          console.log('   • ID:', formation.id);
          console.log('   • Montant:', formation.montant_formate);
          console.log('   • Description:', formation.description);
          console.log('   • Session:', formation.session.libelle);
          console.log('   • Auto-école:', formation.auto_ecole.nom_auto_ecole);
          console.log('   • Statut:', formation.statut_libelle);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DES FORMATIONS');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération des formations: ${error.message}`);
    }
  }

  /**
   * Récupère une formation par son ID
   */
  async getFormationById(id: string, token: string): Promise<FormationApiResponse> {
    try {
      console.log(`📚 Récupération de la formation ID: ${id}...`);
      
      const response = await axiosClient.get(`/formations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Formation récupérée avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 DÉTAILS FORMATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.success && response.data.data) {
        const formation = response.data.data;
        
        console.log('📋 Informations générales:');
        console.log('  • ID:', formation.id);
        console.log('  • Type permis:', formation.type_permis.libelle);
        console.log('  • Montant:', formation.montant_formate);
        console.log('  • Description:', formation.description);
        console.log('  • Session:', formation.session.libelle);
        console.log('  • Statut:', formation.statut_libelle);
        
        console.log('\n🏫 Auto-école:');
        console.log('  • Nom:', formation.auto_ecole.nom_auto_ecole);
        console.log('  • Email:', formation.auto_ecole.email);
        console.log('  • Contact:', formation.auto_ecole.contact);
        
        if (formation.dossiers && formation.dossiers.length > 0) {
          console.log('\n📁 Dossiers:');
          console.log('  • Nombre total:', formation.dossiers.length);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DE LA FORMATION');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération de la formation: ${error.message}`);
    }
  }

  /**
   * Récupère les formations d'une auto-école spécifique
   */
  async getFormationsByAutoEcole(autoEcoleId: string, token: string): Promise<FormationApiItem[]> {
    try {
      console.log(`📚 Récupération des formations pour l'auto-école ID: ${autoEcoleId}...`);
      
      const response = await axiosClient.get(`/formations?auto_ecole_id=${autoEcoleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Formations de l\'auto-école récupérées avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📚 FORMATIONS AUTO-ÉCOLE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.data) {
        console.log('📋 Nombre de formations:', response.data.data.length);
        
        response.data.data.forEach((formation: FormationApiItem, index: number) => {
          console.log(`\n${index + 1}. ${formation.type_permis.libelle}`);
          console.log('   • ID:', formation.id);
          console.log('   • Montant:', formation.montant_formate);
          console.log('   • Description:', formation.description);
          console.log('   • Session:', formation.session.libelle);
          console.log('   • Statut:', formation.statut_libelle);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data.data || [];
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DES FORMATIONS AUTO-ÉCOLE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération des formations auto-école: ${error.message}`);
    }
  }
}

// Instance singleton du service
export const formationsService = new FormationsService();
