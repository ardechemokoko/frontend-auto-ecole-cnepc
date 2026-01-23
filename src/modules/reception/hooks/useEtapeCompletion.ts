import { useState, useEffect, useMemo, useCallback } from 'react';
import { EtapeCircuit, CircuitSuivi } from '../services/circuit-suivi.service';
import { areAllPiecesValidated } from '../utils/etapeHelpers';

/**
 * Hook pour gérer la complétion des étapes du circuit
 */
export const useEtapeCompletion = (
  etapes: EtapeCircuit[],
  circuit: CircuitSuivi | null,
  documentsForCurrentDossier: any[],
  dossierId?: string,
  typeDocuments: any[] = [],
  piecesJustificativesMap: Map<string, any> = new Map()
) => {
  // Fonction pour charger les étapes complétées depuis localStorage
  const loadCompletedEtapesFromStorage = useCallback((dossierId: string): Set<string> => {
    try {
      const stored = localStorage.getItem(`completed_etapes_${dossierId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const completedSet = new Set<string>(parsed);
        console.log(`📦 Étapes complétées chargées depuis localStorage pour dossier ${dossierId}:`, completedSet.size);
        return completedSet;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement des étapes complétées depuis localStorage:', error);
    }
    return new Set<string>();
  }, []);

  // Fonction pour sauvegarder les étapes complétées dans localStorage
  const saveCompletedEtapesToStorage = useCallback((dossierId: string, completedEtapes: Set<string>) => {
    try {
      const array = Array.from(completedEtapes);
      localStorage.setItem(`completed_etapes_${dossierId}`, JSON.stringify(array));
      console.log(`💾 Étapes complétées sauvegardées dans localStorage pour dossier ${dossierId}:`, array.length);
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde des étapes complétées dans localStorage:', error);
    }
  }, []);

  // Initialiser avec les étapes complétées depuis localStorage si disponible
  const [completedEtapes, setCompletedEtapes] = useState<Set<string>>(() => {
    if (dossierId) {
      return loadCompletedEtapesFromStorage(dossierId);
    }
    return new Set();
  });

  // Effet consolidé pour charger et maintenir les étapes complétées
  // Combine : localStorage, circuit statut_libelle, et validation par documents
  useEffect(() => {
    if (!dossierId) return;
    
    console.log('🔄 Recalcul des étapes complétées pour le dossier:', dossierId);
    
    // 1. Charger depuis localStorage
    const storedCompleted = loadCompletedEtapesFromStorage(dossierId);
    
    // 2. Charger depuis le circuit (statut_libelle)
    const completedFromStatut = new Set<string>();
    if (circuit && circuit.etapes) {
      circuit.etapes.forEach(etape => {
        if (etape.statut_libelle && (
          etape.statut_libelle.toLowerCase().includes('complété') ||
          etape.statut_libelle.toLowerCase().includes('complete') ||
          etape.statut_libelle.toLowerCase().includes('terminé') ||
          etape.statut_libelle.toLowerCase().includes('termine')
        )) {
          completedFromStatut.add(etape.id);
        }
      });
    }
    
    // 3. Vérifier les étapes stockées dans localStorage sont toujours valides
    // (basées sur les documents disponibles)
    const validatedFromDocuments = new Set<string>();
    if (etapes.length > 0 && documentsForCurrentDossier.length > 0) {
      storedCompleted.forEach(etapeId => {
        const etape = etapes.find(e => e.id === etapeId);
        if (etape) {
          // Vérifier si toutes les pièces de cette étape sont toujours validées
          const allValidated = areAllPiecesValidated(
            etape,
            documentsForCurrentDossier,
            new Set([etapeId]),
            new Set([etapeId]),
            typeDocuments,
            piecesJustificativesMap
          );
          
          if (allValidated) {
            validatedFromDocuments.add(etapeId);
            console.log(`✅ Étape ${etape.libelle} toujours complétée (documents validés présents)`);
          } else {
            console.log(`⚠️ Étape ${etape.libelle} n'est plus complétée (documents manquants ou non validés)`);
          }
        } else {
          // Si l'étape n'existe plus dans le circuit, la conserver quand même
          validatedFromDocuments.add(etapeId);
        }
      });
    } else {
      // Si pas encore de documents ou d'étapes, utiliser celles de localStorage
      storedCompleted.forEach(id => validatedFromDocuments.add(id));
    }
    
    // 4. Fusionner toutes les sources (localStorage validées + circuit)
    const merged = new Set([...validatedFromDocuments, ...completedFromStatut]);
    
    // 5. Ne mettre à jour que si les étapes complétées ont changé
    setCompletedEtapes(prev => {
      // Comparer les sets pour éviter les mises à jour inutiles
      const prevArray = Array.from(prev).sort();
      const mergedArray = Array.from(merged).sort();
      const hasChanged = prevArray.length !== mergedArray.length || 
        prevArray.some((id, idx) => id !== mergedArray[idx]);
      
      if (hasChanged) {
        console.log(`📋 Étapes complétées fusionnées: ${merged.size} (${validatedFromDocuments.size} depuis localStorage validées, ${completedFromStatut.size} depuis circuit)`);
        // Sauvegarder la version fusionnée
        saveCompletedEtapesToStorage(dossierId, merged);
        return merged;
      }
      
      return prev;
    });
  }, [
    dossierId, 
    circuit?.id, 
    circuit?.etapes?.map(e => `${e.id}-${e.statut_libelle}`).join(','),
    etapes.map(e => e.id).join(','),
    // Utiliser une clé basée sur les IDs des documents pour éviter les re-renders inutiles
    documentsForCurrentDossier.map(d => `${d.id}-${d.valide}`).join(','),
    typeDocuments.map(td => td.id).join(','),
    Array.from(piecesJustificativesMap.keys()).join(','),
    loadCompletedEtapesFromStorage,
    saveCompletedEtapesToStorage
  ]);

  // Calculer les étapes complétées UNIQUEMENT depuis statut_libelle (pas de validation automatique)
  // Les étapes ne sont marquées comme complétées que via le bouton "Passer à l'étape suivante"
  const getCompletedEtapesForDossier = useCallback((etapes: EtapeCircuit[]): Set<string> => {
    const completed = new Set<string>();
    
    const etapesOrdered = (circuit && circuit.etapes && circuit.etapes.length > 0) 
      ? circuit.etapes 
      : etapes;
    
    // Ne marquer comme complétées QUE les étapes qui ont un statut_libelle indiquant qu'elles sont complétées
    // (c'est-à-dire qu'elles ont été validées manuellement via le bouton "Passer à l'étape suivante")
    for (let idx = 0; idx < etapesOrdered.length; idx++) {
      const etape = etapesOrdered[idx];
      
      // Vérifier si l'étape est déjà marquée comme complétée via statut_libelle
      // C'est la seule source de vérité pour déterminer si une étape est complétée
      const isCompletedFromStatut = etape.statut_libelle && (
        etape.statut_libelle.toLowerCase().includes('complété') ||
        etape.statut_libelle.toLowerCase().includes('complete') ||
        etape.statut_libelle.toLowerCase().includes('terminé') ||
        etape.statut_libelle.toLowerCase().includes('termine')
      );
      
      if (isCompletedFromStatut) {
        completed.add(etape.id);
        console.log(`✅ Étape complétée détectée depuis statut_libelle: ${etape.libelle} (${etape.statut_libelle})`);
      }
    }

    return completed;
  }, [circuit]);

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
    
    console.log('🔍 Calcul allEtapesCompleted:', {
      totalEtapes: etapes.length,
      etapesCompletes,
      progression,
      allEtapesCompleted,
      completedEtapesIds: Array.from(computedCompletedEtapes),
      etapesIds: etapes.map(e => e.id)
    });
    
    return { etapesCompletes, allEtapesCompleted, progression };
  }, [etapes, computedCompletedEtapes]);


  const markEtapeAsCompleted = useCallback((etapeId: string) => {
    console.log('🎯 markEtapeAsCompleted appelé pour:', etapeId);
    setCompletedEtapes(prev => {
      const newSet = new Set([...prev, etapeId]);
      console.log('✅ Étape ajoutée à completedEtapes. Total:', newSet.size);
      
      // Sauvegarder dans localStorage si on a un dossierId
      if (dossierId) {
        saveCompletedEtapesToStorage(dossierId, newSet);
      }
      
      return newSet;
    });
  }, [dossierId, saveCompletedEtapesToStorage]);

  return {
    completedEtapes,
    computedCompletedEtapes,
    etapesCompletes,
    allEtapesCompleted,
    progression,
    markEtapeAsCompleted
  };
};

