import { useState, useEffect, useMemo, useCallback } from 'react';
import { EtapeCircuit, CircuitSuivi } from '../services/circuit-suivi.service';

/**
 * Hook pour gérer la complétion des étapes du circuit
 */
export const useEtapeCompletion = (
  etapes: EtapeCircuit[],
  circuit: CircuitSuivi | null,
  documentsForCurrentDossier: any[],
  dossierId?: string
) => {
  const [completedEtapes, setCompletedEtapes] = useState<Set<string>>(new Set());

  // Réinitialiser les étapes complétées quand le dossier change
  useEffect(() => {
    if (dossierId) {
      console.log('🔄 Réinitialisation des étapes complétées pour le dossier:', dossierId);
      setCompletedEtapes(new Set());
    }
  }, [dossierId]);

  // Calculer dynamiquement les étapes complétées basées sur les documents du dossier actuel
  const getCompletedEtapesForDossier = useCallback((etapes: EtapeCircuit[]): Set<string> => {
    const completed = new Set<string>();
    
    const getEtapeIndex = (etape: EtapeCircuit): number => {
      if (!circuit || !circuit.etapes) return -1;
      return circuit.etapes.findIndex(e => e.id === etape.id);
    };
    
    const areAllPiecesValidatedForEtape = (etape: EtapeCircuit): boolean => {
      if (!etape.pieces || etape.pieces.length === 0) {
        return false;
      }
      
      const allValidated = etape.pieces.every(piece => {
        const docsForPiece = documentsForCurrentDossier.filter(doc => 
          doc.piece_justification_id === piece.type_document
        );
        const isValidated = docsForPiece.length > 0 && docsForPiece.some(doc => doc.valide === true);
        
        if (!isValidated) {
          console.log(`🔍 areAllPiecesValidatedForEtape - Pièce non validée dans ${etape.libelle}:`, {
            pieceLibelle: piece.libelle,
            pieceTypeDocument: piece.type_document,
            documentsCount: docsForPiece.length
          });
        }
        
        return isValidated;
      });
      
      return allValidated;
    };
    
    const etapesOrdered = (circuit && circuit.etapes && circuit.etapes.length > 0) 
      ? circuit.etapes 
      : etapes;
    
    for (let idx = 0; idx < etapesOrdered.length; idx++) {
      const etape = etapesOrdered[idx];
      const etapeIndex = getEtapeIndex(etape);
      
      if (etapeIndex === -1) {
        continue;
      }
      
      // Première étape
      if (etapeIndex === 0) {
        if (!etape.pieces || etape.pieces.length === 0) {
          // Étape sans pièces : ne pas marquer automatiquement
        } else {
          const allPiecesValidated = areAllPiecesValidatedForEtape(etape);
          if (allPiecesValidated) {
            completed.add(etape.id);
          }
        }
        continue;
      }
      
      // Étapes suivantes
      if (!circuit || !circuit.etapes || etapeIndex <= 0) {
        continue;
      }
      
      const previousEtape = circuit.etapes[etapeIndex - 1];
      if (!previousEtape) {
        continue;
      }
      
      let previousCompleted = completed.has(previousEtape.id);
      
      if (!previousCompleted) {
        if (!previousEtape.pieces || previousEtape.pieces.length === 0) {
          // Étape précédente sans pièces : vérifier récursivement
          let allBeforeCompleted = true;
          for (let i = 0; i < etapeIndex - 1; i++) {
            const beforeEtape = circuit.etapes[i];
            if (!beforeEtape) {
              allBeforeCompleted = false;
              break;
            }
            if (!completed.has(beforeEtape.id)) {
              if (!beforeEtape.pieces || beforeEtape.pieces.length === 0) {
                let canBeCompleted = true;
                for (let j = 0; j < i; j++) {
                  const beforeBeforeEtape = circuit.etapes[j];
                  if (!beforeBeforeEtape) {
                    canBeCompleted = false;
                    break;
                  }
                  if (!completed.has(beforeBeforeEtape.id)) {
                    if (beforeBeforeEtape.pieces && beforeBeforeEtape.pieces.length > 0) {
                      if (!areAllPiecesValidatedForEtape(beforeBeforeEtape)) {
                        canBeCompleted = false;
                        break;
                      }
                    }
                  }
                }
                if (canBeCompleted) {
                  completed.add(beforeEtape.id);
                } else {
                  allBeforeCompleted = false;
                  break;
                }
              } else {
                if (areAllPiecesValidatedForEtape(beforeEtape)) {
                  completed.add(beforeEtape.id);
                } else {
                  allBeforeCompleted = false;
                  break;
                }
              }
            }
          }
          if (allBeforeCompleted) {
            completed.add(previousEtape.id);
            previousCompleted = true;
            console.log(`✅ Étape précédente sans pièces ${previousEtape.libelle} - MARQUÉE automatiquement`);
          }
        } else {
          const previousAllPiecesValidated = areAllPiecesValidatedForEtape(previousEtape);
          if (previousAllPiecesValidated) {
            completed.add(previousEtape.id);
            previousCompleted = true;
          }
        }
      }
      
      if (!previousCompleted) {
        continue;
      }
      
      // Si l'étape précédente est complétée, vérifier si cette étape peut être complétée
      if (!etape.pieces || etape.pieces.length === 0) {
        if (previousCompleted) {
          completed.add(etape.id);
          console.log(`✅ Étape sans pièces ${etape.libelle} - MARQUÉE automatiquement`);
        }
      } else {
        const allPiecesValidated = areAllPiecesValidatedForEtape(etape);
        if (allPiecesValidated) {
          completed.add(etape.id);
          console.log(`✅ Étape avec pièces ${etape.libelle} - MARQUÉE comme complétée`);
        }
      }
    }

    return completed;
  }, [documentsForCurrentDossier, circuit]);

  // Calculer les étapes complétées pour le dossier actuel
  const computedCompletedEtapes = useMemo(() => {
    const computed = getCompletedEtapesForDossier(etapes);
    const merged = new Set([...computed, ...completedEtapes]);
    console.log('🔍 computedCompletedEtapes - Fusion:', {
      computedSize: computed.size,
      completedEtapesSize: completedEtapes.size,
      mergedSize: merged.size
    });
    return merged;
  }, [etapes, getCompletedEtapesForDossier, completedEtapes]);

  // Calculer la progression globale
  const { etapesCompletes, allEtapesCompleted, progression } = useMemo(() => {
    if (!computedCompletedEtapes || etapes.length === 0) {
      return { etapesCompletes: 0, allEtapesCompleted: false, progression: 0 };
    }
    
    const etapesCompletes = computedCompletedEtapes.size;
    const progression = Math.round((etapesCompletes / etapes.length) * 100);
    const allEtapesCompleted = etapes.every(etape => computedCompletedEtapes.has(etape.id));
    
    return { etapesCompletes, allEtapesCompleted, progression };
  }, [etapes, computedCompletedEtapes]);

  const markEtapeAsCompleted = (etapeId: string) => {
    setCompletedEtapes(prev => new Set([...prev, etapeId]));
  };

  return {
    completedEtapes,
    computedCompletedEtapes,
    etapesCompletes,
    allEtapesCompleted,
    progression,
    markEtapeAsCompleted
  };
};

