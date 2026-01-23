import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Stack, 
  CircularProgress,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { EtapeCircuit } from '../services/circuit-suivi.service';
import { CircuitEtapesCardProps, ValidationDialogState } from '../types/circuit-etapes.types';
import { useCircuitEtapes } from '../hooks/useCircuitEtapes';
import { useEtapeCompletion } from '../hooks/useEtapeCompletion';
import { useDocumentUploadForPiece } from '../hooks/useDocumentUploadForPiece';
import { useEtapeTransmission } from '../hooks/useEtapeTransmission';
import { useCNEDDTTransfer } from '../hooks/useCNEDDTTransfer';
import { useDocumentPieceMapping } from '../hooks/useDocumentPieceMapping';
import { getEtapeStatus, areAllPiecesValidated, getPreviousEtape, getNextEtape } from '../utils/etapeHelpers';
import { EtapeAccordion } from './EtapeAccordion';
import { ValidationDialog } from './ValidationDialog';
import { CNEDDTButton } from './CNEDDTButton';
import { DateExamenDialog } from './DateExamenDialog';
import axiosClient from '../../../shared/environment/envdev';
import { computeOverall, computeGeneral } from '../tables/ReceptionDossierTypeTable/utils';

const CircuitEtapesCard: React.FC<CircuitEtapesCardProps> = ({
  circuit,
  loadingCircuit,
  loadingTypeDocuments,
  typeDocuments,
  documentsFromApi,
  isDocumentValidatedForPiece,
  dossierId,
  dossierComplet,
  onDocumentUploaded,
  uploading = false,
  onUpdateDocument,
  onAllEtapesCompletedChange,
  epreuvesStatus,
  loadingEpreuves = false,
  onSendToCNEDDT,
  pieceJustificationTypeMap = new Map()
}) => {
  // Utiliser le hook pour le mapping persistant avec localStorage
  const { loadMappingFromStorage } = useDocumentPieceMapping();

  // Filtrer et normaliser les documents pour ne garder que ceux du dossier actuel
  // IMPORTANT: Normaliser avec le mapping localStorage pour inclure les documents simulés
  const documentsForCurrentDossier = useMemo(() => {
    if (!dossierId) return documentsFromApi;
    
    // Charger le mapping depuis localStorage
    const mapping = loadMappingFromStorage();
    
    const filtered = documentsFromApi.filter(doc => {
      return !doc.documentable_id || doc.documentable_id === dossierId;
    });
    
    // Normaliser les documents avec le mapping localStorage
    return filtered.map(doc => {
      // 1. PRIORITÉ: Utiliser le mapping localStorage (source de vérité pour documents simulés)
      const mappedPieceId = doc.id ? mapping.get(doc.id) : null;
      
      // 2. Fallback: Utiliser piece_justification_id de l'API si disponible
      const apiPieceId = doc.piece_justification_id || null;
      
      // Utiliser le mapping en priorité
      const finalPieceId = mappedPieceId || apiPieceId;
      
      return {
        ...doc,
        piece_justification_id: finalPieceId,
        // S'assurer que les documents simulés sont marqués comme validés
        valide: doc.is_simulated ? (doc.valide !== undefined ? doc.valide : true) : doc.valide
      };
    });
  }, [documentsFromApi, dossierId, loadMappingFromStorage]);

  // Debug: Log du circuit reçu
  useEffect(() => {
    console.log('🔍 CircuitEtapesCard - Circuit reçu:', {
      circuit: circuit ? {
        id: circuit.id,
        libelle: circuit.libelle,
        nom_entite: circuit.nom_entite,
        hasId: !!circuit.id,
        hasLibelle: !!circuit.libelle,
        etapesCount: circuit.etapes?.length || 0
      } : null,
      loadingCircuit,
      loadingTypeDocuments
    });
  }, [circuit, loadingCircuit, loadingTypeDocuments]);

  // Hook pour gérer les étapes du circuit
  const { etapes, loadingEtapes, errorEtapes } = useCircuitEtapes(circuit, loadingCircuit);

  // État pour stocker les pièces justificatives (doit être déclaré avant useEtapeCompletion)
  const [piecesJustificativesMap, setPiecesJustificativesMap] = useState<Map<string, any>>(new Map());
  
  // État pour suivre les programmes sessions créés (pour l'étape ENVOI DOSSIER POUR EXAMEN)
  const [programmeSessionsMap, setProgrammeSessionsMap] = useState<Map<string, boolean>>(new Map());
  
  // État pour suivre les statuts des épreuves par étape
  const [epreuvesStatusMap, setEpreuvesStatusMap] = useState<Map<string, { status: string | null; loading: boolean }>>(new Map());

  // Hook pour gérer la complétion des étapes
  const {
    completedEtapes,
    computedCompletedEtapes,
    etapesCompletes,
    allEtapesCompleted,
    progression,
    markEtapeAsCompleted
  } = useEtapeCompletion(etapes, circuit, documentsForCurrentDossier, dossierId, typeDocuments, piecesJustificativesMap);

  // Hook pour gérer l'upload de documents
  const {
    uploadingForPiece,
    fileInputRefs,
    handleUploadForPiece,
    handleFileSelectForPiece,
    handleSimulateUploadForPiece
  } = useDocumentUploadForPiece(dossierId, onDocumentUploaded);
  
  // État pour suivre quelle pièce est en cours de simulation
  const [simulatingForPiece, setSimulatingForPiece] = useState<string | null>(null);

  // Hook pour le mapping temporaire (utilisé dans d'autres parties du code)
  useDocumentPieceMapping();

  // État pour le modal de date d'examen
  const [dateExamenDialogOpen, setDateExamenDialogOpen] = useState(false);
  const [dateExamenCallback, setDateExamenCallback] = useState<((dateExamen: string) => Promise<void>) | null>(null);
  const [dateExamenLoading, setDateExamenLoading] = useState(false);

  // Fonction pour ouvrir le modal de date d'examen
  const openDateExamenDialog = (callback: (dateExamen: string) => Promise<void>) => {
    setDateExamenCallback(() => callback);
    setDateExamenDialogOpen(true);
  };

  // Récupérer l'email du candidat depuis les données du dossier
  const candidatEmail = dossierComplet?.candidat?.personne?.email || 
                        dossierComplet?.data?.candidat?.personne?.email || 
                        null;

  // Hook pour gérer la transmission entre étapes
  const {
    transmittingEtape,
    handleCompleteLastEtape,
    handleTransmitToNextEtape
  } = useEtapeTransmission(circuit, dossierId, onDocumentUploaded, markEtapeAsCompleted, openDateExamenDialog, candidatEmail);

  // Hook pour gérer l'envoi à CNEDDT
  const {
    sendingToCNEDDT,
    sentToCNEDDT,
    handleSendToCNEDDT
  } = useCNEDDTTransfer(dossierId, circuit, onSendToCNEDDT);

  // État pour le dialogue de validation
  const [validationDialog, setValidationDialog] = useState<ValidationDialogState>({
    open: false,
    document: null,
    valide: false,
    commentaires: ''
  });
  const [updatingDocument, setUpdatingDocument] = useState<string | null>(null);

  // Effect pour récupérer les pièces justificatives avec un seul GET
  useEffect(() => {
    const fetchPiecesJustificatives = async () => {
      // Extraire tous les piece_justification_id uniques des documents
      const pieceJustificationIds = new Set<string>();
      documentsForCurrentDossier.forEach(doc => {
        if (doc.piece_justification_id && doc.piece_justification_id !== 'N/A') {
          pieceJustificationIds.add(doc.piece_justification_id);
        }
      });

      if (pieceJustificationIds.size === 0) {
        setPiecesJustificativesMap(new Map());
        return;
      }

      try {
        // Faire un seul GET /pieces-justificatives
        const response = await axiosClient.get('/pieces-justificatives');
        
        // Extraire les données de la réponse
        let allPieces: any[] = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            allPieces = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            allPieces = response.data.data;
          } else if (response.data.data && !Array.isArray(response.data.data)) {
            allPieces = [response.data.data];
          } else {
            allPieces = [response.data];
          }
        }
        
        // Filtrer pour ne garder que les pièces dont l'ID correspond aux piece_justification_id des documents
        const filteredPieces = allPieces.filter(piece => {
          return pieceJustificationIds.has(piece.id);
        });

        // Créer une Map pour un accès rapide : piece_justification_id -> données de la pièce
        const piecesMap = new Map<string, any>();
        filteredPieces.forEach(piece => {
          const formattedPiece = {
            id: piece.id || null,
            type_document_id: piece.type_document_id || null,
            code: piece.code || null,
            libelle: piece.libelle || null,
            format_attendu: piece.format_attendu || null,
            obligatoire: piece.obligatoire ?? null,
            delivery_date: piece.delivery_date || null,
            expiration_date: piece.expiration_date || null,
            created_at: piece.created_at || null,
            updated_at: piece.updated_at || null,
            etape_id: piece.etape_id || null
          };
          
          piecesMap.set(piece.id, formattedPiece);
        });

        setPiecesJustificativesMap(piecesMap);
      } catch (error: any) {
        console.error('❌ CircuitEtapesCard - Erreur lors de la récupération des pièces justificatives:', error);
        setPiecesJustificativesMap(new Map());
      }
    };

    // Exécuter uniquement si on a des documents
    if (documentsForCurrentDossier.length > 0) {
      fetchPiecesJustificatives();
    } else {
      setPiecesJustificativesMap(new Map());
    }
  }, [documentsForCurrentDossier]);

  // Vérifier si un programme session existe pour le dossier (pour l'étape ENVOI DOSSIER POUR EXAMEN)
  useEffect(() => {
    const checkProgrammeSessions = async () => {
      if (!dossierId) return;
      
      // Vérifier si une étape "ENVOI DU DOSSIER POUR EXAMEN" existe
      const envoiEtape = etapes.find(etape => 
        etape.libelle?.toUpperCase().includes('ENVOI DU DOSSIER POUR EXAMEN') || 
        etape.code?.toUpperCase().includes('ENVOI_DOSSIER_EXAMEN')
      );
      
      if (!envoiEtape) return;
      
      try {
        // Vérifier si un programme session existe pour ce dossier
        const response = await axiosClient.get('/programme-sessions', {
          params: { dossier_id: dossierId }
        });
        
        const sessions = Array.isArray(response.data?.data) 
          ? response.data.data 
          : (response.data?.data && Array.isArray(response.data.data.data) 
            ? response.data.data.data 
            : []);
        
        const hasSession = sessions.length > 0;
        setProgrammeSessionsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(envoiEtape.id, hasSession);
          return newMap;
        });
        
        // Si un programme session existe, charger le statut des épreuves
        if (hasSession) {
          try {
            const resultatsResponse = await axiosClient.get('/resultats', {
              params: { dossier_id: dossierId }
            });
            
            const resultats = Array.isArray(resultatsResponse.data?.data) ? resultatsResponse.data.data : [];
            
            if (resultats.length === 0) {
              setEpreuvesStatusMap(prev => {
                const newMap = new Map(prev);
                newMap.set(envoiEtape.id, { status: 'non_saisi', loading: false });
                return newMap;
              });
              return;
            }
            
            // Organiser les résultats par type d'examen
            const creneauxAttempts: any[] = [];
            const codeConduiteAttempts: any[] = [];
            const tourVilleAttempts: any[] = [];
            
            resultats.forEach((resultat: any) => {
              const attempt = {
                result: resultat.statut,
                date: resultat.date,
                note: resultat.commentaire || ''
              };
              
              const typeExamen = (resultat.typeExamen || '').toLowerCase().trim();
              
              if (typeExamen.includes('creneau') || typeExamen === 'creneaux') {
                creneauxAttempts.push(attempt);
              } else if (typeExamen.includes('code') || typeExamen === 'codeconduite' || typeExamen === 'code_conduite') {
                codeConduiteAttempts.push(attempt);
              } else if (typeExamen.includes('ville') || typeExamen === 'tourville' || typeExamen === 'tour_ville') {
                tourVilleAttempts.push(attempt);
              }
            });
            
            // Calculer les statuts
            const creneauxStatus = computeOverall(creneauxAttempts);
            const codeStatus = computeOverall(codeConduiteAttempts);
            const villeStatus = computeOverall(tourVilleAttempts);
            const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
            
            setEpreuvesStatusMap(prev => {
              const newMap = new Map(prev);
              newMap.set(envoiEtape.id, { status: generalStatus, loading: false });
              return newMap;
            });
          } catch (error) {
            console.error('Erreur lors du chargement du statut des épreuves:', error);
            setEpreuvesStatusMap(prev => {
              const newMap = new Map(prev);
              newMap.set(envoiEtape.id, { status: null, loading: false });
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du programme session:', error);
      }
    };
    
    if (etapes.length > 0 && dossierId) {
      checkProgrammeSessions();
    }
  }, [etapes, dossierId]);
  
  // Écouter l'événement de création de programme session
  useEffect(() => {
    const handleProgrammeSessionCreated = (event: CustomEvent) => {
      if (event.detail?.dossierId === dossierId) {
        const etapeId = event.detail?.etapeId;
        if (etapeId) {
          setProgrammeSessionsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(etapeId, true);
            return newMap;
          });
          
          // Recharger le statut des épreuves après un délai
          setTimeout(() => {
            if (dossierId) {
              const envoiEtape = etapes.find(etape => etape.id === etapeId);
              if (envoiEtape) {
                // Recharger le statut (code similaire à celui ci-dessus)
                axiosClient.get('/resultats', {
                  params: { dossier_id: dossierId }
                }).then(resultatsResponse => {
                  const resultats = Array.isArray(resultatsResponse.data?.data) ? resultatsResponse.data.data : [];
                  
                  if (resultats.length === 0) {
                    setEpreuvesStatusMap(prev => {
                      const newMap = new Map(prev);
                      newMap.set(etapeId, { status: 'non_saisi', loading: false });
                      return newMap;
                    });
                    return;
                  }
                  
                  const creneauxAttempts: any[] = [];
                  const codeConduiteAttempts: any[] = [];
                  const tourVilleAttempts: any[] = [];
                  
                  resultats.forEach((resultat: any) => {
                    const attempt = {
                      result: resultat.statut,
                      date: resultat.date,
                      note: resultat.commentaire || ''
                    };
                    
                    const typeExamen = (resultat.typeExamen || '').toLowerCase().trim();
                    
                    if (typeExamen.includes('creneau') || typeExamen === 'creneaux') {
                      creneauxAttempts.push(attempt);
                    } else if (typeExamen.includes('code') || typeExamen === 'codeconduite' || typeExamen === 'code_conduite') {
                      codeConduiteAttempts.push(attempt);
                    } else if (typeExamen.includes('ville') || typeExamen === 'tourville' || typeExamen === 'tour_ville') {
                      tourVilleAttempts.push(attempt);
                    }
                  });
                  
                  const creneauxStatus = computeOverall(creneauxAttempts);
                  const codeStatus = computeOverall(codeConduiteAttempts);
                  const villeStatus = computeOverall(tourVilleAttempts);
                  const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
                  
                  setEpreuvesStatusMap(prev => {
                    const newMap = new Map(prev);
                    newMap.set(etapeId, { status: generalStatus, loading: false });
                    return newMap;
                  });
                }).catch(error => {
                  console.error('Erreur lors du rechargement du statut:', error);
                });
              }
            }
          }, 1000);
        }
      }
    };
    
    window.addEventListener('programmeSessionCreated', handleProgrammeSessionCreated as EventListener);
    return () => {
      window.removeEventListener('programmeSessionCreated', handleProgrammeSessionCreated as EventListener);
    };
  }, [dossierId, etapes]);

  // Notifier le parent si toutes les étapes sont complétées
  useEffect(() => {
    if (onAllEtapesCompletedChange) {
      onAllEtapesCompletedChange(allEtapesCompleted);
    }
  }, [allEtapesCompleted, onAllEtapesCompletedChange]);

  // Handlers pour le dialogue de validation
  const handleOpenValidationDialog = (doc: any) => {
    setValidationDialog({
      open: true,
      document: doc,
      valide: doc.valide || false,
      commentaires: doc.commentaires || ''
    });
  };

  const handleCloseValidationDialog = () => {
    setValidationDialog({
      open: false,
      document: null,
      valide: false,
      commentaires: ''
    });
  };

  const handleSaveValidation = async () => {
    if (!validationDialog.document || !onUpdateDocument) return;

    try {
      setUpdatingDocument(validationDialog.document.id);
      await onUpdateDocument(validationDialog.document.id, {
        valide: validationDialog.valide,
        commentaires: validationDialog.commentaires
      });
      handleCloseValidationDialog();
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du document:', error);
    } finally {
      setUpdatingDocument(null);
    }
  };

  // Fonction pour vérifier si l'étape précédente est complétée
  // IMPORTANT: Ne marque PAS automatiquement les étapes comme complétées
  // Vérifie uniquement si l'étape précédente est complétée (via statut_libelle) pour autoriser l'accès à l'étape suivante
  const isPreviousEtapeCompleted = (etape: EtapeCircuit): boolean => {
    const previousEtape = getPreviousEtape(etape, circuit);
    if (!previousEtape) {
      return true; // Pas d'étape précédente
    }

    // Vérifier uniquement si l'étape précédente est marquée comme complétée via statut_libelle
    // (c'est-à-dire qu'elle a été validée manuellement via le bouton "Passer à l'étape suivante")
    if (computedCompletedEtapes.has(previousEtape.id) || completedEtapes.has(previousEtape.id)) {
      return true;
    }

    // Vérifier aussi le statut_libelle directement
    const isCompletedFromStatut = previousEtape.statut_libelle && (
      previousEtape.statut_libelle.toLowerCase().includes('complété') ||
      previousEtape.statut_libelle.toLowerCase().includes('complete') ||
      previousEtape.statut_libelle.toLowerCase().includes('terminé') ||
      previousEtape.statut_libelle.toLowerCase().includes('termine')
    );

    return isCompletedFromStatut || false;
  };

  // États de chargement
  if (loadingCircuit || loadingTypeDocuments) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary" className="font-primary">
              Chargement du circuit et des types de documents...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Circuit invalide - Vérifier seulement après que le chargement soit terminé
  // Si le circuit n'a pas d'id ou de libelle après le chargement, afficher un message
  if (!circuit || !circuit.id || !circuit.libelle) {
    console.log('⚠️ CircuitEtapesCard - Circuit invalide ou manquant:', {
      circuit: circuit,
      hasId: circuit?.id,
      hasLibelle: circuit?.libelle,
      loadingCircuit,
      loadingTypeDocuments,
      circuitType: typeof circuit,
      circuitKeys: circuit ? Object.keys(circuit) : []
    });
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="info">
            Aucun circuit associé à ce dossier. Le circuit sera chargé automatiquement une fois le type de demande défini.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chargement des étapes
  if (loadingEtapes) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary" className="font-primary">
              Chargement des étapes du circuit...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Aucune étape trouvée
  if (etapes.length === 0) {
    // À ce point, circuit ne peut pas être null car on a déjà vérifié
    if (!circuit) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
            <Typography variant="h6" fontWeight="bold" className="font-display">
              Circuit: {circuit.libelle}
            </Typography>
          </Box>
          {errorEtapes ? (
            <Alert severity="warning">{errorEtapes}</Alert>
          ) : (
            <Alert severity="info">
              Aucune étape définie pour ce circuit.
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  const totalEtapes = etapes.length;

  // À ce point, circuit ne peut pas être null car on a déjà vérifié
  if (!circuit) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
            <Typography variant="h6" fontWeight="bold" className="font-display">
              Circuit: {circuit.libelle}
            </Typography>
          </Box>
          <Chip 
            label={`${etapesCompletes}/${totalEtapes} étapes complétées`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Barre de progression */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" className="font-primary">
              Progression du circuit
            </Typography>
            <Typography variant="body2" fontWeight="bold" className="font-primary">
              {progression}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progression} 
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
        
        <Stack spacing={2}>
          {etapes.map((etape: EtapeCircuit, index: number) => {
            const previousEtape = circuit ? getPreviousEtape(etape, circuit) : null;
            const nextEtape = circuit ? getNextEtape(etape, circuit) : null;
            const previousCompleted = isPreviousEtapeCompleted(etape);
            const isEtapeCompleted = computedCompletedEtapes.has(etape.id) || completedEtapes.has(etape.id);
            const isEtapeWithoutPieces = !etape.pieces || etape.pieces.length === 0;
            const isLastEtape = !nextEtape;
            const isFirstEtape = !previousEtape;
            
            const allValidated = areAllPiecesValidated(
              etape,
              documentsForCurrentDossier,
              completedEtapes,
              computedCompletedEtapes,
              typeDocuments,
              piecesJustificativesMap
            );
            
            // Vérifier si c'est l'étape "ENVOI DU DOSSIER POUR EXAMEN"
            const isEnvoiDossierExamen = etape.libelle?.toUpperCase().includes('ENVOI DU DOSSIER POUR EXAMEN') || 
                                       etape.code?.toUpperCase().includes('ENVOI_DOSSIER_EXAMEN');
            
            // Vérifier si un programme session existe pour cette étape
            const programmeSessionCreated = programmeSessionsMap.get(etape.id) || false;
            const epreuvesStatusData = epreuvesStatusMap.get(etape.id) || { status: null, loading: false };
            const epreuvesStatus = epreuvesStatusData.status;
            
            // Modifier le statut de l'étape si c'est "ENVOI DOSSIER POUR EXAMEN" et qu'un programme session existe
            let etapeStatus = getEtapeStatus(
              etape,
              previousCompleted,
              computedCompletedEtapes,
              completedEtapes,
              documentsForCurrentDossier
            );
            
            // Si c'est l'étape "ENVOI DOSSIER POUR EXAMEN" et qu'un programme session existe
            if (isEnvoiDossierExamen && programmeSessionCreated) {
              // Si le statut des épreuves n'est pas encore 'reussi', l'étape est en attente des résultats
              if (epreuvesStatus !== 'reussi') {
                etapeStatus = {
                  status: 'in_progress',
                  label: 'En attente des résultats',
                  color: 'warning'
                };
              } else {
                // Si le statut est 'reussi', l'étape peut être complétée
                etapeStatus = {
                  status: 'completed',
                  label: 'Résultats validés - Prêt à passer à l\'étape suivante',
                  color: 'success'
                };
              }
            }

            // Logique pour déterminer si le bouton doit être affiché
            // Le bouton doit s'afficher si :
            // 1. L'étape précédente est complétée OU c'est la première étape
            // 2. ET il y a une étape suivante OU c'est la dernière étape
            // 3. ET (toutes les pièces sont validées OU l'étape n'a pas de pièces OU l'étape est complétée)
            // 4. Pour "ENVOI DOSSIER POUR EXAMEN": le programme session doit être créé
            const shouldShow = (previousCompleted || isFirstEtape) && 
              (!!nextEtape || isLastEtape) &&
              (allValidated || isEtapeWithoutPieces || isEtapeCompleted) &&
              (!isEnvoiDossierExamen || programmeSessionCreated);
            
            // Le bouton est activé si :
            // - Toutes les pièces sont validées OU
            // - L'étape n'a pas de pièces OU
            // - L'étape est complétée (pour permettre de passer à l'étape suivante même si déjà complétée)
            // - Pour "ENVOI DOSSIER POUR EXAMEN": le statut des épreuves doit être 'reussi'
            const isButtonEnabled = (allValidated || isEtapeWithoutPieces || isEtapeCompleted) &&
              (!isEnvoiDossierExamen || epreuvesStatus === 'reussi');

            return (
              <EtapeAccordion
                key={etape.id}
                etape={etape}
                index={index}
                etapeStatus={etapeStatus}
                circuit={circuit}
                typeDocuments={typeDocuments}
                documentsForCurrentDossier={documentsForCurrentDossier}
                isDocumentValidatedForPiece={isDocumentValidatedForPiece}
                isPreviousEtapeCompleted={previousCompleted}
                computedCompletedEtapes={computedCompletedEtapes}
                completedEtapes={completedEtapes}
                areAllPiecesValidated={allValidated}
                isEtapeCompleted={isEtapeCompleted}
                isEtapeWithoutPieces={isEtapeWithoutPieces}
                isLastEtape={isLastEtape}
                isFirstEtape={isFirstEtape}
                shouldShowButton={shouldShow}
                isButtonEnabled={isButtonEnabled}
                transmittingEtape={transmittingEtape}
                dossierId={dossierId}
                uploadingForPiece={uploadingForPiece}
                uploading={uploading}
                onUpdateDocument={onUpdateDocument}
                onOpenValidationDialog={handleOpenValidationDialog}
                onUploadForPiece={handleUploadForPiece}
                onFileSelectForPiece={handleFileSelectForPiece}
                onSimulateUploadForPiece={handleSimulateUploadForPiece ? async (piece, etape) => {
                  const pieceId = `${etape.id}-${piece.type_document}`;
                  setSimulatingForPiece(pieceId);
                  try {
                    await handleSimulateUploadForPiece(piece, etape);
                  } finally {
                    setSimulatingForPiece(null);
                  }
                } : undefined}
                isSimulatingForPiece={simulatingForPiece}
                fileInputRefs={fileInputRefs}
                onCompleteLastEtape={handleCompleteLastEtape}
                onTransmitToNextEtape={handleTransmitToNextEtape}
                pieceJustificationTypeMap={pieceJustificationTypeMap}
              />
            );
          })}
        </Stack>

        {/* Bouton pour envoyer à la CNEDDT */}
        <CNEDDTButton
          allEtapesCompleted={allEtapesCompleted}
          dossierId={dossierId}
          epreuvesStatus={epreuvesStatus}
          loadingEpreuves={loadingEpreuves}
          sendingToCNEDDT={sendingToCNEDDT}
          sentToCNEDDT={sentToCNEDDT}
          onSendToCNEDDT={handleSendToCNEDDT}
        />
      </CardContent>

      {/* Dialogue de validation */}
      <ValidationDialog
        open={validationDialog.open}
        validationDialog={validationDialog}
        updatingDocument={updatingDocument}
        onClose={handleCloseValidationDialog}
        onSave={handleSaveValidation}
        onValideChange={(valide) => setValidationDialog(prev => ({ ...prev, valide }))}
        onCommentairesChange={(commentaires) => setValidationDialog(prev => ({ ...prev, commentaires }))}
      />

      {/* Dialogue de sélection de date d'examen */}
      <DateExamenDialog
        open={dateExamenDialogOpen}
        onClose={() => {
          setDateExamenDialogOpen(false);
          setDateExamenCallback(null);
        }}
        onConfirm={async (dateExamen: string) => {
          if (dateExamenCallback) {
            setDateExamenLoading(true);
            try {
              await dateExamenCallback(dateExamen);
              setDateExamenDialogOpen(false);
              setDateExamenCallback(null);
            } catch (error: any) {
              // L'erreur est déjà gérée dans le callback avec alert
              // Mais on peut aussi afficher un message dans le modal si nécessaire
              console.error('Erreur lors de la confirmation de la date:', error);
              // Ne pas fermer le modal en cas d'erreur pour permettre à l'utilisateur de réessayer
              // Le modal restera ouvert pour permettre une nouvelle tentative
            } finally {
              setDateExamenLoading(false);
            }
          }
        }}
        loading={dateExamenLoading || !!transmittingEtape}
      />
    </Card>
  );
};

export default CircuitEtapesCard;
