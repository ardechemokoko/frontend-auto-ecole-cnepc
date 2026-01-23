export type PermisFormatType = 'standard' | 'op';

export interface NumeroPermisParts {
  annee: string;
  province: string;
  categorie: string;
  numero: string;
}

export interface PermisData {
  numero_permis: string;
  numero_origine_permis: string;
  lieu_de_dobtention_du_permis: string;
  date_de_dobtention_du_permis: string;
  date_de_delivrance_du_permis: string;
}

export interface PersonneData {
  nom: string;
  prenom: string;
  email: string;
  contact: string;
  telephone: string;
  adresse: string;
  password: string;
  password_confirmation: string;
}

export interface CandidatData {
  date_naissance: string;
  lieu_naissance: string;
  nip: string;
  type_piece: string;
  numero_piece: string;
  nationalite: string;
  genre: string;
}

export interface FormationData {
  formation_id: string;
  referenciel_id: string;
  commentaires: string;
}

export interface CreateDossierFormProps {
  onSuccess: () => void;
}

