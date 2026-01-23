import { CircuitSuivi, EtapeCircuit, PieceEtape } from '../services/circuit-suivi.service';

export interface CircuitEtapesCardProps {
  circuit: CircuitSuivi | null;
  loadingCircuit: boolean;
  loadingTypeDocuments: boolean;
  typeDocuments: any[];
  documentsFromApi: any[];
  getDocumentsByType: (typeDocumentId: string) => any[];
  getDocumentsForPiece?: (piece: any) => any[];
  isDocumentValidated: (typeDocumentId: string) => boolean;
  isDocumentValidatedForPiece?: (piece: any) => boolean;
  dossierId?: string;
  dossierComplet?: any; // Données complètes du dossier avec candidat.personne.email
  onDocumentUploaded?: () => void;
  uploading?: boolean;
  onUpdateDocument?: (documentId: string, data: { valide: boolean; commentaires?: string }) => Promise<void>;
  onAllEtapesCompletedChange?: (allCompleted: boolean) => void;
  epreuvesStatus?: string;
  loadingEpreuves?: boolean;
  onSendToCNEDDT?: () => void;
  pieceJustificationTypeMap?: Map<string, { libelle: string }>; // Map piece_justification_id -> { libelle }
}

export interface ValidationDialogState {
  open: boolean;
  document: any | null;
  valide: boolean;
  commentaires: string;
}

export interface EtapeStatus {
  status: 'pending' | 'in_progress' | 'completed';
  label: string;
  color: 'default' | 'warning' | 'success';
}

export type { CircuitSuivi, EtapeCircuit, PieceEtape };

