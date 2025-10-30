// Types pour le module Réception des dossiers
export type EpreuveStatut = 'non_saisi' | 'reussi' | 'echoue' | 'absent';

export interface EpreuveAttempt {
  result: Exclude<EpreuveStatut, 'non_saisi'>;
  date: string; // ISO
  note?: string;
}

export interface EpreuvesResultat {
  // rétrocompat: statut global si présent
  creneaux?: EpreuveStatut;
  codeConduite?: EpreuveStatut;
  tourVille?: EpreuveStatut;
  // statut général calculé sur l'ensemble des épreuves
  general?: EpreuveStatut;
  // nouvelle structure: tentatives (max 3)
  creneauxAttempts?: EpreuveAttempt[];
  codeConduiteAttempts?: EpreuveAttempt[];
  tourVilleAttempts?: EpreuveAttempt[];
  notes?: string;
  dateSaisie?: string; // ISO
}

export interface ReceptionDossier {
  id: string;
  reference: string;
  candidatNom: string;
  candidatPrenom: string;
  autoEcoleNom: string;
  dateEnvoi: string; // ISO
  statut: 'envoye' | 'recu' | 'en_attente';
  dateExamen?: string; // ISO
  details?: any; // réponse complète (programme_session)
  epreuves?: EpreuvesResultat;
}

export interface ReceptionActionResponse {
  success: boolean;
  message?: string;
}


