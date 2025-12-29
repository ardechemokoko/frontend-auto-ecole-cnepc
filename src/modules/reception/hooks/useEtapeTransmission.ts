import { useState } from 'react';
import axiosClient from '../../../shared/environment/envdev';
import { EtapeCircuit, CircuitSuivi } from '../services/circuit-suivi.service';
import { getNextEtape } from '../utils/etapeHelpers';

export const useEtapeTransmission = (
  circuit: CircuitSuivi | null,
  dossierId?: string,
  onDocumentUploaded?: () => void,
  markEtapeAsCompleted?: (etapeId: string) => void
) => {
  const [transmittingEtape, setTransmittingEtape] = useState<string | null>(null);

  const handleCompleteLastEtape = async (etape: EtapeCircuit) => {
    if (!circuit || !circuit.id || !dossierId) {
      console.error('❌ Données manquantes pour finaliser l\'étape');
      return;
    }

    try {
      setTransmittingEtape(etape.id);
      console.log('📤 Finalisation de la dernière étape...', {
        currentEtape: etape.libelle,
        etapeId: etape.id
      });

      // Marquer l'étape actuelle comme complétée
      if (etape.statut_id) {
        try {
          const completedPayload = {
            code: etape.code || '',
            libelle: `${etape.libelle} - Complété`,
            annulable: false,
            final: true
          };

          try {
            await axiosClient.patch(`/workflow/statuts/${etape.statut_id}`, completedPayload);
            console.log('✅ Statut de la dernière étape mis à jour comme complété');
          } catch (completedError: any) {
            console.warn('⚠️ Impossible de mettre à jour le statut:', completedError);
            try {
              await axiosClient.put(`/workflow/statuts/${etape.statut_id}`, completedPayload);
              console.log('✅ Statut mis à jour (PUT)');
            } catch (putError: any) {
              console.warn('⚠️ Impossible de mettre à jour le statut avec PUT:', putError);
            }
          }
        } catch (err: any) {
          console.warn('⚠️ Erreur lors du marquage:', err);
        }
      }

      if (markEtapeAsCompleted) {
        markEtapeAsCompleted(etape.id);
      }

      if (onDocumentUploaded) {
        await onDocumentUploaded();
      }

      alert(`Dernière étape complétée avec succès: ${etape.libelle}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la finalisation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la finalisation';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setTransmittingEtape(null);
    }
  };

  const handleTransmitToNextEtape = async (etape: EtapeCircuit) => {
    if (!circuit || !circuit.id || !dossierId) {
      console.error('❌ Données manquantes pour transmettre l\'étape');
      return;
    }

    const nextEtape = getNextEtape(etape, circuit);
    if (!nextEtape) {
      await handleCompleteLastEtape(etape);
      return;
    }

    if (!nextEtape.statut_id) {
      console.error('❌ L\'étape suivante n\'a pas de statut_id');
      alert('Impossible de passer à l\'étape suivante: statut manquant');
      return;
    }

    try {
      setTransmittingEtape(etape.id);
      console.log('📤 Transmission de l\'étape vers l\'étape suivante...', {
        currentEtape: etape.libelle,
        nextEtape: nextEtape.libelle
      });

      const statutId = nextEtape.statut_id;
      const payload = {
        code: nextEtape.code || '',
        libelle: nextEtape.statut_libelle || nextEtape.libelle || '',
        annulable: true,
        final: false
      };

      let response;
      try {
        response = await axiosClient.put(`/workflow/statuts/${statutId}`, payload);
        console.log('✅ Statut mis à jour avec succès (PUT)');
      } catch (putError: any) {
        if (putError.response?.status === 405 || putError.response?.status === 404 || putError.response?.status === 500) {
          console.log('⚠️ PUT échoué, tentative avec PATCH...');
          try {
            response = await axiosClient.patch(`/workflow/statuts/${statutId}`, payload);
            console.log('✅ Statut mis à jour avec succès (PATCH)');
          } catch (patchError: any) {
            throw patchError;
          }
        } else {
          throw putError;
        }
      }

      // Marquer l'étape actuelle comme complétée
      if (etape.statut_id) {
        try {
          const completedPayload = {
            code: etape.code || '',
            libelle: `${etape.libelle} - Complété`,
            annulable: false,
            final: false
          };

          try {
            await axiosClient.patch(`/workflow/statuts/${etape.statut_id}`, completedPayload);
            console.log('✅ Statut de l\'étape précédente mis à jour');
          } catch (completedError: any) {
            console.warn('⚠️ Impossible de mettre à jour le statut:', completedError);
          }
        } catch (err: any) {
          console.warn('⚠️ Erreur lors du marquage:', err);
        }
      }

      if (markEtapeAsCompleted) {
        markEtapeAsCompleted(etape.id);
      }

      if (onDocumentUploaded) {
        await onDocumentUploaded();
      }

      alert(`Étape transmise avec succès. Passage à l'étape: ${nextEtape.libelle}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la transmission:', error);
      let errorMessage = 'Erreur lors de la transmission';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += ` (${validationErrors})`;
      }
      
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setTransmittingEtape(null);
    }
  };

  return {
    transmittingEtape,
    handleCompleteLastEtape,
    handleTransmitToNextEtape
  };
};

