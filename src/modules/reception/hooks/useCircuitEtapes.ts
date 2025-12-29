import { useState, useEffect, useMemo } from 'react';
import { EtapeCircuit, CircuitSuivi, circuitSuiviService } from '../services/circuit-suivi.service';

export const useCircuitEtapes = (
  circuit: CircuitSuivi | null,
  loadingCircuit: boolean
) => {
  const [etapes, setEtapes] = useState<EtapeCircuit[]>(circuit?.etapes || []);
  const [loadingEtapes, setLoadingEtapes] = useState(false);
  const [errorEtapes, setErrorEtapes] = useState<string | null>(null);

  // Synchroniser les étapes avec le circuit quand il change
  useEffect(() => {
    // Ne rien faire si le circuit est en cours de chargement
    if (loadingCircuit) {
      return;
    }

    // Si le circuit a des étapes, les utiliser directement
    if (circuit?.etapes && circuit.etapes.length > 0) {
      console.log('✅ useCircuitEtapes - Synchronisation des étapes depuis le circuit:', {
        circuitId: circuit.id,
        circuitLibelle: circuit.libelle,
        etapesCount: circuit.etapes.length
      });
      setEtapes(circuit.etapes);
      setErrorEtapes(null);
      return;
    }

    // Si le circuit n'a pas d'étapes mais a un ID, les charger
    if (circuit?.id && (!circuit.etapes || circuit.etapes.length === 0)) {
      console.log('⚠️ useCircuitEtapes - Circuit sans étapes, chargement depuis l\'API...', {
        circuitId: circuit.id,
        circuitLibelle: circuit.libelle
      });
      
      const chargerEtapes = async () => {
        try {
          setLoadingEtapes(true);
          setErrorEtapes(null);
          
          const etapesData = await circuitSuiviService.getEtapesByCircuitId(circuit.id!);
          
          if (etapesData.length > 0) {
            console.log('✅ useCircuitEtapes - Étapes chargées depuis l\'API:', {
              count: etapesData.length
            });
            setEtapes(etapesData);
            setErrorEtapes(null);
          } else {
            console.warn('⚠️ useCircuitEtapes - Aucune étape trouvée pour le circuit:', circuit.id);
            setEtapes([]);
            setErrorEtapes('Aucune étape trouvée pour ce circuit');
          }
        } catch (err: any) {
          console.error('❌ useCircuitEtapes - Erreur lors du chargement des étapes:', err);
          setEtapes([]);
          setErrorEtapes(err.message || 'Erreur lors du chargement des étapes');
        } finally {
          setLoadingEtapes(false);
        }
      };

      chargerEtapes();
    } else if (!circuit) {
      // Si pas de circuit, réinitialiser les étapes seulement si on n'est pas en train de charger
      setEtapes([]);
      setErrorEtapes(null);
    }
  }, [circuit, loadingCircuit]);

  return {
    etapes,
    loadingEtapes,
    errorEtapes
  };
};

