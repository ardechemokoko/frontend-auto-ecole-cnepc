import { useState } from 'react';
import axiosClient from '../../../shared/environment/envdev';
import { EtapeCircuit, CircuitSuivi } from '../services/circuit-suivi.service';
import { getNextEtape } from '../utils/etapeHelpers';
import { ROUTES } from '../../../shared/constants';

// Type pour la fonction callback d'ouverture du modal
export type OpenDateExamenDialogCallback = (onConfirm: (dateExamen: string) => Promise<void>) => void;

export const useEtapeTransmission = (
  circuit: CircuitSuivi | null,
  dossierId?: string,
  onDocumentUploaded?: () => void,
  markEtapeAsCompleted?: (etapeId: string) => void,
  openDateExamenDialog?: OpenDateExamenDialogCallback,
  candidatEmail?: string | null
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
        console.log('✅ Dernière étape marquée comme complétée:', etape.id);
      }

      if (onDocumentUploaded) {
        await onDocumentUploaded();
        // Attendre un peu pour laisser le temps au backend de mettre à jour le statut
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Recharger à nouveau pour récupérer le circuit mis à jour
        await onDocumentUploaded();
      }

      // Émettre un événement pour déclencher le rechargement du circuit
      window.dispatchEvent(new CustomEvent('circuitReload', {
        detail: { dossierId, circuitId: circuit.id }
      }));

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

    // Vérifier si l'étape est "ENVOI DU DOSSIER POUR EXAMEN"
    const isEnvoiDossierExamen = etape.libelle?.toUpperCase().includes('ENVOI DU DOSSIER POUR EXAMEN') || 
                                 etape.code?.toUpperCase().includes('ENVOI_DOSSIER_EXAMEN');

    if (isEnvoiDossierExamen) {
      // Vérifier si un programme session existe déjà pour ce dossier
      try {
        const sessionsResponse = await axiosClient.get('/programme-sessions', {
          params: { dossier_id: dossierId }
        });
        
        const sessions = Array.isArray(sessionsResponse.data?.data) 
          ? sessionsResponse.data.data 
          : (sessionsResponse.data?.data && Array.isArray(sessionsResponse.data.data.data) 
            ? sessionsResponse.data.data.data 
            : []);
        
        // Si un programme session existe déjà, passer à l'étape suivante normalement
        // (cela signifie que les résultats sont validés et qu'on peut passer à l'étape suivante)
        if (sessions.length > 0) {
          console.log('✅ Programme session existe déjà, passage à l\'étape suivante...');
          // Continuer avec le comportement normal (ne pas return ici)
        } else {
          // Si aucun programme session n'existe, créer un nouveau
          if (openDateExamenDialog) {
            openDateExamenDialog(async (dateExamen: string) => {
              await createProgrammeSession(etape, dateExamen);
            });
            return;
          }
          
          // Sinon, essayer de créer sans date (pour compatibilité)
          await createProgrammeSession(etape, '');
          return;
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du programme session:', error);
        // En cas d'erreur, essayer de créer un nouveau programme session
        if (openDateExamenDialog) {
          openDateExamenDialog(async (dateExamen: string) => {
            await createProgrammeSession(etape, dateExamen);
          });
          return;
        }
        
        await createProgrammeSession(etape, '');
        return;
      }
    }

    // Comportement normal pour les autres étapes
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

  const createProgrammeSession = async (etape: EtapeCircuit, dateExamen: string) => {
    if (!circuit || !circuit.id || !dossierId) {
      console.error('❌ Données manquantes pour créer le programme session');
      return;
    }

    if (!dateExamen) {
      alert('La date d\'examen est obligatoire');
      return;
    }

    try {
      setTransmittingEtape(etape.id);
      console.log('📤 Création du programme session pour l\'étape ENVOI DU DOSSIER POUR EXAMEN...', {
        etapeId: etape.id,
        etapeLibelle: etape.libelle,
        dossierId,
        dateExamen
      });

      // Formater la date au format attendu par l'API
      // Utiliser le format ISO 8601 comme dans les autres parties du code (EleveInscritDetailsPage, EleveDetailsSheet)
      let formattedDateExamen = dateExamen;
      if (dateExamen && dateExamen.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Créer un objet Date et le formater en ISO 8601
        const dateObj = new Date(dateExamen);
        dateObj.setHours(8, 0, 0, 0); // 08:00:00
        formattedDateExamen = dateObj.toISOString();
        
        console.log('📅 Formatage de la date:', {
          original: dateExamen,
          dateObj: dateObj,
          isoString: formattedDateExamen
        });
      }

      const payload = {
        dossier_id: dossierId,
        date_examen: formattedDateExamen
      };

      console.log('📤 Payload envoyé à l\'API:', {
        ...payload,
        date_examen_original: dateExamen,
        date_examen_formatted: formattedDateExamen
      });

      const response = await axiosClient.post('/programme-sessions', payload);

      if (response.data?.success || response.data?.programme_session) {
        console.log('✅ Programme session créé avec succès:', response.data);

        // NE PAS marquer l'étape comme complétée automatiquement après la création du programme session
        // L'étape doit rester en "attente des résultats" jusqu'à ce que les résultats soient validés
        // et que l'utilisateur clique sur "Passer à l'étape suivante"
        // Le statut de l'étape sera mis à jour uniquement quand l'utilisateur clique sur "Passer à l'étape suivante"

        if (onDocumentUploaded) {
          await onDocumentUploaded();
        }

        // Émettre un événement pour déclencher le rechargement du circuit
        window.dispatchEvent(new CustomEvent('circuitReload', {
          detail: { dossierId, circuitId: circuit.id }
        }));

        // Émettre un événement pour indiquer que le programme session a été créé
        window.dispatchEvent(new CustomEvent('programmeSessionCreated', {
          detail: {
            etapeId: etape.id,
            circuitId: circuit.id,
            dossierId,
            programmeSession: response.data?.programme_session || response.data?.data
          }
        }));

        alert('Dossier envoyé à l\'examen avec succès ! Vous pouvez maintenant passer à l\'étape suivante une fois les résultats validés.');
      } else {
        throw new Error('Format de réponse inattendu');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la création du programme session:', error);
      
      // Afficher tous les détails de l'erreur
      const errorDetails: any = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers
        }
      };
      
      // Afficher le contenu complet de la réponse
      if (error.response?.data) {
        errorDetails.responseData = error.response.data;
        console.error('❌ Contenu complet de la réponse d\'erreur:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.error('❌ Détails de l\'erreur:', errorDetails);
      
      let errorMessage = 'Erreur lors de la création du programme session';
      
      // Gestion des erreurs détaillée
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Message principal
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        // Analyser l'erreur spécifique
        if (errorData.error && typeof errorData.error === 'string') {
          // Si l'erreur mentionne "email" sur null, c'est un bug backend connu
          if (errorData.error.includes('email') && errorData.error.includes('null')) {
            errorMessage = 'Erreur serveur : Problème de chargement des données du dossier.\n\n' +
                          'Le serveur n\'arrive pas à charger les relations du dossier (candidat, personne, email).\n\n' +
                          'Ceci est un problème technique côté serveur. Veuillez :\n' +
                          '1. Vérifier que le dossier a bien un candidat et une personne associés\n' +
                          '2. Recharger la page et réessayer\n' +
                          '3. Si le problème persiste, contacter l\'administrateur système\n\n' +
                          'Note : Le format de la requête est correct, le problème vient du traitement côté serveur.';
          } else {
            errorMessage = errorData.error;
          }
        }
        
        // Erreurs de validation
        if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const fieldLabel = field === 'date_examen' ? 'Date d\'examen' : field;
              return `${fieldLabel}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            })
            .join('\n');
          errorMessage += `\n\nErreurs de validation:\n${validationErrors}`;
        }
        
        // Détails supplémentaires pour les erreurs 500
        if (error.response.status === 500) {
          if (!errorMessage.includes('Données du dossier incomplètes')) {
            errorMessage += '\n\nErreur serveur (500). Veuillez vérifier les logs du serveur ou contacter l\'administrateur.';
          }
          if (errorData.exception || errorData.trace) {
            console.error('❌ Détails techniques de l\'erreur serveur:', {
              exception: errorData.exception,
              trace: errorData.trace
            });
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Afficher l'erreur dans une alerte avec plus de détails
      alert(`Erreur: ${errorMessage}\n\nCode d'erreur: ${error.response?.status || 'N/A'}`);
      
      throw error; // Re-lancer pour que le modal puisse gérer l'erreur
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

