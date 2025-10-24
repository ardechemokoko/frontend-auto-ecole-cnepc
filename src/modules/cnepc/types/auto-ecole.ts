// Types pour la gestion des auto-écoles
export interface AutoEcole {
  id: string;
  nom_auto_ecole: string;
  adresse: string;
  email: string;
  contact: string;
  statut: boolean;
  statut_libelle: string;
  responsable_id: string;
  responsable: Personne;
  formations?: Formation[];
  dossiers?: Dossier[];
  created_at: string;
  updated_at: string;
}

export interface Personne {
  id: string;
  utilisateur_id?: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  email: string;
  contact: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}

export interface AutoEcoleFormData {
  nom_auto_ecole: string;
  adresse: string;
  email: string;
  contact: string;
  statut: boolean;
  responsable_id: string;
}

export interface Candidat {
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
  age?: number | string;
  personne: Personne;
  dossiers?: Dossier[];
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  auto_ecole_id: string;
  type_permis_id: string;
  montant?: number;
  montant_formate?: string;
  nom?: string;
  description?: string;
  prix?: number;
  duree_jours?: number;
  session_id?: string;
  statut: boolean;
  statut_libelle?: string;
  auto_ecole?: AutoEcole;
  typePermis?: TypePermis | Referentiel;
  type_permis?: TypePermis | Referentiel;
  session?: Referentiel;
  dossiers?: Dossier[];
  created_at: string;
  updated_at: string;
}

export interface TypePermis {
  id: string;
  nom: string;
  categorie: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Referentiel {
  id: string;
  libelle: string;
  code: string;
  type_ref: string;
  description?: string;
  statut: boolean;
  statut_libelle: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  dossier_id: string;
  type_document_id?: string;
  nom?: string;
  nom_fichier?: string;
  type?: string;
  chemin_fichier: string;
  type_mime?: string;
  taille_fichier?: number;
  taille_fichier_formate?: string;
  statut?: string;
  valide?: boolean;
  valide_libelle?: string;
  date_upload?: string;
  commentaires?: string;
  dossier?: Dossier;
  type_document?: Referentiel;
  created_at: string;
  updated_at: string;
}

export interface Dossier {
  id: string;
  candidat_id: string;
  auto_ecole_id: string;
  formation_id: string;
  statut: 'en_attente' | 'en_cours' | 'valide' | 'rejete';
  date_creation: string;
  date_modification: string;
  commentaires?: string;
  candidat: Candidat;
  formation: Formation;
  documents: Document[];
  created_at: string;
  updated_at: string;
}

export interface MesDossiersResponse {
  success: boolean;
  auto_ecole: AutoEcole;
  dossiers: Dossier[];
  statistiques: {
    total: number;
    en_attente: number;
    en_cours: number;
    valide: number;
    rejete: number;
  };
}

export interface AutoEcoleResponse {
  success: boolean;
  message: string;
  data?: AutoEcole;
  errors?: Record<string, string[]>;
}

export interface AutoEcoleListResponse {
  data: AutoEcole[];
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
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface CandidatListResponse {
  data: Candidat[];
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
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface FormationFormData {
  auto_ecole_id: string;
  type_permis_id: string;
  montant: number;
  description?: string;
  session_id: string;
  statut: boolean;
  // Champs optionnels pour compatibilité
  nom?: string;
  prix?: number;
  duree_jours?: number;
}

export interface DossierFormData {
  candidat_id: string;
  auto_ecole_id: string;
  formation_id: string;
  numero_dossier?: string;
  statut: 'en_attente' | 'en_cours' | 'valide' | 'rejete';
  date_creation: string;
  commentaires?: string;
}

export interface CandidatFormData {
  personne_id: string;
  numero_candidat: string;
  date_naissance: string;
  lieu_naissance: string;
  nip: string;
  type_piece: string;
  numero_piece: string;
  nationalite: string;
  genre: string;
}

export interface PersonneFormData {
  nom: string;
  prenom: string;
  email: string;
  contact: string;
  adresse: string;
}

// Types pour les filtres et recherches
export interface AutoEcoleFilters {
  statut?: boolean;
  responsable_id?: string;
  search?: string;
}

export interface DossierFilters {
  statut?: 'en_attente' | 'en_cours' | 'valide' | 'rejete';
  formation_id?: string;
  candidat_id?: string;
}

export interface CandidatFilters {
  nationalite?: string;
  genre?: string;
  statut?: string;
  search?: string;
}
