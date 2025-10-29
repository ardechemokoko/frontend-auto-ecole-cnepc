// Service pour la gestion des candidats
import axiosClient from '../../../shared/environment/envdev';

// Types pour les candidats
export interface CandidatApiResponse {
  data: CandidatApiItem[];
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

export interface CandidatApiItem {
  id: string;
  personne_id: string;
  numero_candidat: string;
  date_naissance: string;
  lieu_naissance: string;
  nip: string;
  type_piece: string;
  numero_piece: string;
  nationalite: string;
  genre: string;
  age: string;
  personne: {
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
  dossiers: DossierApiItem[];
  created_at: string;
  updated_at: string;
}

export interface DossierApiItem {
  id: string;
  candidat_id: string;
  auto_ecole_id: string;
  formation_id: string;
  statut: string;
  date_creation: string;
  date_modification: string;
  commentaires: string;
  candidat: any;
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
  formation: FormationApiItem;
  documents: DocumentApiItem[];
  etape: {
    id: string;
    code: string;
    libelle: string;
    ordre: number;
    auto_advance: boolean;
    statut_systeme: string;
    circuit_id: string;
    statut_id: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
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
  auto_ecole: any;
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

export interface DocumentApiItem {
  id: string;
  dossier_id: string;
  type_document_id: string;
  nom_fichier: string;
  chemin_fichier: string;
  type_mime: string;
  taille_fichier: number;
  taille_fichier_formate: string;
  valide: boolean;
  valide_libelle: string;
  commentaires: string;
  dossier: any;
  type_document: {
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
  created_at: string;
  updated_at: string;
}

export class CandidatsService {
  /**
   * Récupère tous les candidats
   */
  async getAllCandidats(token: string, page: number = 1, perPage: number = 50): Promise<CandidatApiResponse> {
    try {
      console.log('👥 Récupération de tous les candidats...');
      
      const response = await axiosClient.get(`/candidats?page=${page}&per_page=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Candidats récupérés avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👥 CANDIDATS DISPONIBLES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.data) {
        console.log('📋 Nombre de candidats:', response.data.data.length);
        
        response.data.data.forEach((candidat: CandidatApiItem, index: number) => {
          console.log(`\n${index + 1}. ${candidat.personne.nom_complet}`);
          console.log('   • ID:', candidat.id);
          console.log('   • Numéro candidat:', candidat.numero_candidat);
          console.log('   • Email:', candidat.personne.email);
          console.log('   • Contact:', candidat.personne.contact);
          console.log('   • Nationalité:', candidat.nationalite);
          console.log('   • Dossiers:', candidat.dossiers?.length || 0);
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DES CANDIDATS');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération des candidats: ${error.message}`);
    }
  }

  /**
   * Récupère un candidat par son ID
   */
  async getCandidatById(id: string, token: string): Promise<CandidatApiItem> {
    try {
      console.log(`👤 Récupération du candidat ID: ${id}...`);
      
      const response = await axiosClient.get(`/candidats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Candidat récupéré avec succès');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👤 DÉTAILS CANDIDAT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (response.data && response.data.data) {
        const candidat = response.data.data;
        
        console.log('📋 Informations générales:');
        console.log('  • ID:', candidat.id);
        console.log('  • Numéro candidat:', candidat.numero_candidat);
        console.log('  • Nom complet:', candidat.personne.nom_complet);
        console.log('  • Email:', candidat.personne.email);
        console.log('  • Contact:', candidat.personne.contact);
        console.log('  • Adresse:', candidat.personne.adresse);
        console.log('  • Date naissance:', candidat.date_naissance);
        console.log('  • Lieu naissance:', candidat.lieu_naissance);
        console.log('  • Nationalité:', candidat.nationalite);
        console.log('  • Genre:', candidat.genre);
        console.log('  • Âge:', candidat.age);
        
        if (candidat.dossiers && candidat.dossiers.length > 0) {
          console.log('\n📁 Dossiers:');
          console.log('  • Nombre total:', candidat.dossiers.length);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('❌ ERREUR LORS DE LA RÉCUPÉRATION DU CANDIDAT');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Message:', error.message);
      
      if (error.response) {
        console.error('Statut HTTP:', error.response.status);
        console.error('Données:', error.response.data);
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw new Error(`Erreur lors de la récupération du candidat: ${error.message}`);
    }
  }
}

// Instance singleton du service
export const candidatsService = new CandidatsService();
