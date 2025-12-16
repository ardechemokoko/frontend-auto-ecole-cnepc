import { EtapeCircuit, CircuitSuivi } from '../services/circuit-suivi.service';
import { EtapeStatus } from '../types/circuit-etapes.types';

/**
 * Obtient l'étape précédente dans le circuit
 */
export const getPreviousEtape = (
  currentEtape: EtapeCircuit,
  circuit: CircuitSuivi | null
): EtapeCircuit | null => {
  if (!circuit || !circuit.etapes || circuit.etapes.length === 0) {
    return null;
  }

  const currentIndex = circuit.etapes.findIndex(e => e.id === currentEtape.id);
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }

  return circuit.etapes[currentIndex - 1];
};

/**
 * Obtient l'étape suivante dans le circuit
 */
export const getNextEtape = (
  currentEtape: EtapeCircuit,
  circuit: CircuitSuivi | null
): EtapeCircuit | null => {
  if (!circuit || !circuit.etapes || circuit.etapes.length === 0) {
    return null;
  }

  const currentIndex = circuit.etapes.findIndex(e => e.id === currentEtape.id);
  if (currentIndex === -1 || currentIndex === circuit.etapes.length - 1) {
    return null;
  }

  return circuit.etapes[currentIndex + 1];
};

/**
 * Vérifie si toutes les pièces d'une étape sont validées
 */
export const areAllPiecesValidated = (
  etape: EtapeCircuit,
  documentsForCurrentDossier: any[],
  completedEtapes: Set<string>,
  computedCompletedEtapes: Set<string>
): boolean => {
  // Les étapes sans pièces ne sont pas automatiquement considérées comme validées
  if (!etape.pieces || etape.pieces.length === 0) {
    return completedEtapes.has(etape.id) || computedCompletedEtapes.has(etape.id);
  }

  // Vérifier que toutes les pièces ont au moins un document validé
  const allValidated = etape.pieces.every(piece => {
    const docsForPiece = documentsForCurrentDossier.filter(doc => 
      doc.piece_justification_id === piece.type_document
    );
    return docsForPiece.length > 0 && docsForPiece.some(doc => doc.valide === true);
  });

  return allValidated;
};

/**
 * Détermine le statut d'une étape
 */
export const getEtapeStatus = (
  etape: EtapeCircuit,
  isPreviousEtapeCompleted: boolean,
  computedCompletedEtapes: Set<string>,
  completedEtapes: Set<string>,
  documentsForCurrentDossier: any[]
): EtapeStatus => {
  // Si l'étape précédente n'est pas complétée, l'étape reste en attente
  if (!isPreviousEtapeCompleted) {
    return { status: 'pending', label: 'En attente (étape précédente non complétée)', color: 'default' };
  }

  // Si l'étape est marquée comme complétée
  if (computedCompletedEtapes.has(etape.id) || completedEtapes.has(etape.id)) {
    return { status: 'completed', label: 'Complétée', color: 'success' };
  }

  // Les étapes sans pièces restent en attente jusqu'à transmission manuelle
  if (!etape.pieces || etape.pieces.length === 0) {
    return { status: 'pending', label: 'En attente de transmission', color: 'default' };
  }

  const piecesObligatoires = etape.pieces.filter(p => p.obligatoire);
  if (piecesObligatoires.length === 0) {
    return { status: 'pending', label: 'En attente', color: 'default' };
  }

  // Vérifier si tous les documents obligatoires sont validés
  const allObligatoryValidated = piecesObligatoires.every(piece => {
    const docsForPiece = documentsForCurrentDossier.filter(doc => 
      doc.piece_justification_id === piece.type_document
    );
    return docsForPiece.some(doc => doc.valide === true);
  });

  if (allObligatoryValidated) {
    return { status: 'completed', label: 'Complétée', color: 'success' };
  }

  // Vérifier si au moins un document obligatoire est fourni
  const hasAnyObligatoryDoc = piecesObligatoires.some(piece => {
    const docsForPiece = documentsForCurrentDossier.filter(doc => 
      doc.piece_justification_id === piece.type_document
    );
    return docsForPiece.length > 0;
  });

  if (hasAnyObligatoryDoc) {
    return { status: 'in_progress', label: 'En cours', color: 'warning' };
  }

  return { status: 'pending', label: 'En attente', color: 'default' };
};

