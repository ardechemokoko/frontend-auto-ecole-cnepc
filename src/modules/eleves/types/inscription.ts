// Types pour les demandes d'inscription

export interface DemandeInscription {
  id: string;
  numero: string;
  eleve: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    nationality: string;
    lieuNaissance: string;
    nationaliteEtrangere?: string;
  };
  autoEcole: {
    id: string;
    name: string;
    email: string;
  };
  dateDemande: string;
  statut: 'en_attente' | 'en_cours' | 'validee' | 'rejetee';
  documents: DocumentInscription[];
  commentaires?: string;
  traiteePar?: string;
  dateTraitement?: string;
}

export interface DocumentInscription {
  id: string;
  type: 'carte_identite' | 'photo' | 'certificat_medical' | 'attestation_aptitude';
  nom: string;
  url: string;
  taille: string;
  dateUpload: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaires?: string;
}

export interface NouvelleDemande {
  eleve: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    nationality: string;
    lieuNaissance: string;
    nationaliteEtrangere?: string;
  };
  documents: File[];
  commentaires?: string;
  pieceIdentite: {
    type: string;
    numero: string;
  };
}

export interface FiltresDemandes {
  statut?: string;
  autoEcole?: string;
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
}

export interface StatistiquesDemandes {
  total: number;
  enAttente: number;
  enCours: number;
  validees: number;
  rejetees: number;
  parAutoEcole: Record<string, number>;
}
