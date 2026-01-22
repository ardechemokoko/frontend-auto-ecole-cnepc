import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  Alert,
  Button,
  CircularProgress,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { EtapeCircuit, PieceEtape } from '../services/circuit-suivi.service';
import { EtapeStatus } from '../types/circuit-etapes.types';
import { PieceCard } from './PieceCard';
import { getPreviousEtape } from '../utils/etapeHelpers';
import { useDocumentPieceMapping } from '../hooks/useDocumentPieceMapping';
import { useUserRole } from '../hooks/useUserRole';
import { isUserAuthorized } from '../utils/roleHelpers';
import axiosClient from '../../../shared/environment/envdev';
import { EpreuveStatut, EpreuveAttempt } from '../types';
import { computeOverall, computeGeneral } from '../tables/ReceptionDossierTypeTable/utils';

interface EtapeAccordionProps {
  etape: EtapeCircuit;
  index: number;
  etapeStatus: EtapeStatus;
  circuit: any;
  typeDocuments: any[];
  documentsForCurrentDossier: any[];
  isDocumentValidatedForPiece?: (piece: any) => boolean;
  isPreviousEtapeCompleted: boolean;
  computedCompletedEtapes: Set<string>;
  completedEtapes: Set<string>;
  areAllPiecesValidated: boolean;
  isEtapeCompleted: boolean;
  isEtapeWithoutPieces: boolean;
  isLastEtape: boolean;
  isFirstEtape: boolean;
  shouldShowButton: boolean;
  isButtonEnabled: boolean;
  transmittingEtape: string | null;
  dossierId?: string;
  uploadingForPiece: string | null;
  uploading: boolean;
  onUpdateDocument?: (documentId: string, data: { valide: boolean; commentaires?: string }) => Promise<void>;
  onOpenValidationDialog: (doc: any) => void;
  onUploadForPiece: (piece: PieceEtape, etape: EtapeCircuit) => void;
  onFileSelectForPiece: (event: React.ChangeEvent<HTMLInputElement>, piece: PieceEtape, etape: EtapeCircuit) => void;
  onSimulateUploadForPiece?: (piece: PieceEtape, etape: EtapeCircuit) => void;
  isSimulatingForPiece?: string | null;
  fileInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  onCompleteLastEtape: (etape: EtapeCircuit) => void;
  onTransmitToNextEtape: (etape: EtapeCircuit) => void;
  pieceJustificationTypeMap?: Map<string, { libelle: string }>; // Map piece_justification_id -> { libelle }
}

export const EtapeAccordion: React.FC<EtapeAccordionProps> = ({
  etape,
  index,
  etapeStatus,
  circuit,
  typeDocuments,
  documentsForCurrentDossier,
  isDocumentValidatedForPiece,
  isPreviousEtapeCompleted,
  computedCompletedEtapes,
  completedEtapes,
  areAllPiecesValidated,
  isEtapeCompleted,
  isEtapeWithoutPieces,
  isLastEtape,
  isFirstEtape,
  shouldShowButton,
  isButtonEnabled,
  transmittingEtape,
  dossierId,
  uploadingForPiece,
  uploading,
  onUpdateDocument,
  onOpenValidationDialog,
  onUploadForPiece,
  onFileSelectForPiece,
  onSimulateUploadForPiece,
  isSimulatingForPiece = null,
  fileInputRefs,
  onCompleteLastEtape,
  onTransmitToNextEtape,
  pieceJustificationTypeMap = new Map()
}) => {
  const previousEtape = getPreviousEtape(etape, circuit);
  const isExpanded = index === 0;
  const [piecesJustificativesMap, setPiecesJustificativesMap] = React.useState<Map<string, any>>(new Map());
  const userRole = useUserRole();
  const authorized = isUserAuthorized(userRole, etape.roles);
  
  // Vérifier si l'étape est "ENVOI DU DOSSIER POUR EXAMEN"
  const isEnvoiDossierExamen = etape.libelle?.toUpperCase().includes('ENVOI DU DOSSIER POUR EXAMEN') || 
                               etape.code?.toUpperCase().includes('ENVOI_DOSSIER_EXAMEN');
  
  // États pour le statut des épreuves
  const [epreuvesStatus, setEpreuvesStatus] = React.useState<EpreuveStatut | null>(null);
  const [loadingEpreuves, setLoadingEpreuves] = React.useState(false);
  const [programmeSessionCreated, setProgrammeSessionCreated] = React.useState(false);
  
  // Log pour déboguer les problèmes d'autorisation
  React.useEffect(() => {
    console.log('🔐 EtapeAccordion - Vérification autorisation:', {
      etapeId: etape.id,
      etapeLibelle: etape.libelle,
      etapeRoles: etape.roles,
      userRole,
      authorized,
      isPreviousEtapeCompleted,
      isFirstEtape
    });
  }, [etape.id, etape.roles, userRole, authorized, isPreviousEtapeCompleted, isFirstEtape]);

  // Charger le statut des résultats pour l'étape "ENVOI DOSSIER POUR EXAMEN"
  React.useEffect(() => {
    const loadEpreuvesStatus = async () => {
      if (!isEnvoiDossierExamen || !dossierId) {
        setEpreuvesStatus(null);
        return;
      }

      try {
        setLoadingEpreuves(true);
        console.log('📋 EtapeAccordion - Chargement du statut des épreuves pour le dossier:', dossierId);
        
        const response = await axiosClient.get('/resultats', {
          params: { dossier_id: dossierId }
        });
        
        const resultats = Array.isArray(response.data?.data) ? response.data.data : [];
        
        if (resultats.length === 0) {
          setEpreuvesStatus('non_saisi');
          setLoadingEpreuves(false);
          return;
        }
        
        // Organiser les résultats par type d'examen
        const creneauxAttempts: EpreuveAttempt[] = [];
        const codeConduiteAttempts: EpreuveAttempt[] = [];
        const tourVilleAttempts: EpreuveAttempt[] = [];
        
        resultats.forEach((resultat: any) => {
          const attempt: EpreuveAttempt = {
            result: resultat.statut as EpreuveStatut,
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
        
        // Trier par date
        creneauxAttempts.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        codeConduiteAttempts.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        tourVilleAttempts.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateA - dateB;
        });
        
        // Calculer les statuts
        const creneauxStatus = computeOverall(creneauxAttempts);
        const codeStatus = computeOverall(codeConduiteAttempts);
        const villeStatus = computeOverall(tourVilleAttempts);
        const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
        
        setEpreuvesStatus(generalStatus);
        console.log('✅ EtapeAccordion - Statut des épreuves chargé:', {
          creneaux: creneauxStatus,
          code: codeStatus,
          ville: villeStatus,
          general: generalStatus
        });
      } catch (error: any) {
        console.error('❌ EtapeAccordion - Erreur lors du chargement du statut des épreuves:', error);
        setEpreuvesStatus('non_saisi');
      } finally {
        setLoadingEpreuves(false);
      }
    };

    loadEpreuvesStatus();
  }, [isEnvoiDossierExamen, dossierId]);

  // Écouter l'événement de création de programme session
  React.useEffect(() => {
    const handleProgrammeSessionCreated = (event: CustomEvent) => {
      if (event.detail?.dossierId === dossierId) {
        setProgrammeSessionCreated(true);
        // Recharger le statut après un délai
        setTimeout(() => {
          if (dossierId && isEnvoiDossierExamen) {
            const loadEpreuvesStatus = async () => {
              try {
                setLoadingEpreuves(true);
                const response = await axiosClient.get('/resultats', {
                  params: { dossier_id: dossierId }
                });
                const resultats = Array.isArray(response.data?.data) ? response.data.data : [];
                
                if (resultats.length === 0) {
                  setEpreuvesStatus('non_saisi');
                  return;
                }
                
                const creneauxAttempts: EpreuveAttempt[] = [];
                const codeConduiteAttempts: EpreuveAttempt[] = [];
                const tourVilleAttempts: EpreuveAttempt[] = [];
                
                resultats.forEach((resultat: any) => {
                  const attempt: EpreuveAttempt = {
                    result: resultat.statut as EpreuveStatut,
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
                
                creneauxAttempts.sort((a, b) => {
                  const dateA = a.date ? new Date(a.date).getTime() : 0;
                  const dateB = b.date ? new Date(b.date).getTime() : 0;
                  return dateA - dateB;
                });
                codeConduiteAttempts.sort((a, b) => {
                  const dateA = a.date ? new Date(a.date).getTime() : 0;
                  const dateB = b.date ? new Date(b.date).getTime() : 0;
                  return dateA - dateB;
                });
                tourVilleAttempts.sort((a, b) => {
                  const dateA = a.date ? new Date(a.date).getTime() : 0;
                  const dateB = b.date ? new Date(b.date).getTime() : 0;
                  return dateA - dateB;
                });
                
                const creneauxStatus = computeOverall(creneauxAttempts);
                const codeStatus = computeOverall(codeConduiteAttempts);
                const villeStatus = computeOverall(tourVilleAttempts);
                const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
                
                setEpreuvesStatus(generalStatus);
              } catch (error) {
                console.error('Erreur lors du rechargement du statut:', error);
              } finally {
                setLoadingEpreuves(false);
              }
            };
            loadEpreuvesStatus();
          }
        }, 1000);
      }
    };
    
    window.addEventListener('programmeSessionCreated', handleProgrammeSessionCreated as EventListener);
    return () => {
      window.removeEventListener('programmeSessionCreated', handleProgrammeSessionCreated as EventListener);
    };
  }, [dossierId, isEnvoiDossierExamen]);

  // Fonction pour obtenir le libellé du statut
  const getStatutLabel = (statut: EpreuveStatut | null): string => {
    if (!statut) return 'Non chargé';
    switch (statut) {
      case 'reussi': return 'Validé';
      case 'echoue': return 'Échoué';
      case 'absent': return 'Absent';
      case 'non_saisi':
      default: return 'Non saisi';
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatutColor = (statut: EpreuveStatut | null): 'success' | 'error' | 'warning' | 'default' => {
    if (!statut) return 'default';
    switch (statut) {
      case 'reussi': return 'success';
      case 'echoue': return 'error';
      case 'absent': return 'warning';
      case 'non_saisi':
      default: return 'default';
    }
  };
  
  // Utiliser le hook pour le mapping persistant avec localStorage
  const { loadMappingFromStorage } = useDocumentPieceMapping();

  // Fonction helper pour obtenir le piece_justification_id d'un document
  // IMPORTANT: Le mapping localStorage est la source de vérité car c'est ce qui a été stocké lors de l'upload
  // Pour les documents simulés, le mapping localStorage est essentiel
  const normalizedDocuments = useMemo(() => {
    // Charger le mapping depuis localStorage
    const mapping = loadMappingFromStorage();
    
    console.log('🔄 EtapeAccordion - Normalisation des documents avec mapping localStorage:', {
      etapeId: etape.id,
      etapeLibelle: etape.libelle,
      totalDocuments: documentsForCurrentDossier.length,
      mappingsCount: mapping.size,
      simulatedDocs: documentsForCurrentDossier.filter(d => d.is_simulated).length
    });
    
    return documentsForCurrentDossier.map(doc => {
      // 1. PRIORITÉ: Utiliser le mapping localStorage (source de vérité pour documents simulés et uploads)
      const mappedPieceId = doc.id ? mapping.get(doc.id) : null;
      
      // 2. Fallback: Utiliser piece_justification_id de l'API si disponible
      const apiPieceId = doc.piece_justification_id || null;
      
      // Utiliser le mapping en priorité
      const finalPieceId = mappedPieceId || apiPieceId;
      
      if (mappedPieceId && mappedPieceId !== apiPieceId) {
        console.log('🔧 EtapeAccordion - Utilisation du mapping localStorage:', {
          documentId: doc.id,
          nomFichier: doc.nom_fichier || doc.nom,
          mappedPieceId,
          apiPieceId,
          isSimulated: doc.is_simulated,
          usingMapping: true
        });
      }
      
      return {
        ...doc,
        piece_justification_id: finalPieceId,
        // S'assurer que les documents simulés sont marqués comme validés
        valide: doc.is_simulated ? (doc.valide !== undefined ? doc.valide : true) : doc.valide
      };
    });
  }, [documentsForCurrentDossier, etape.id, etape.libelle, loadMappingFromStorage]);

  // Effect pour récupérer les pièces justificatives avec un seul GET
  React.useEffect(() => {
    const fetchPiecesJustificatives = async () => {
      // Extraire tous les piece_justification_id uniques des documents
      const pieceJustificationIds = new Set<string>();
      documentsForCurrentDossier.forEach(doc => {
        if (doc.piece_justification_id && doc.piece_justification_id !== 'N/A') {
          pieceJustificationIds.add(doc.piece_justification_id);
        }
      });

      if (pieceJustificationIds.size === 0) {
        console.log('📋 EtapeAccordion - Aucun piece_justification_id trouvé dans les documents');
        setPiecesJustificativesMap(new Map());
        return;
      }

      console.log(`🔄 EtapeAccordion - Récupération de ${pieceJustificationIds.size} pièce(s) justificative(s) unique(s)...`);
      console.log('📋 EtapeAccordion - IDs des pièces justificatives à récupérer:', Array.from(pieceJustificationIds));

      try {
        // Faire un seul GET /pieces-justificatives
        console.log('📡 EtapeAccordion - Appel API GET /pieces-justificatives');
        const response = await axiosClient.get('/pieces-justificatives');
        
        console.log('🔍 EtapeAccordion - Réponse brute de GET /pieces-justificatives:', {
          status: response.status,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          isArray: Array.isArray(response.data),
          arrayLength: Array.isArray(response.data) ? response.data.length : null
        });
        
        // Extraire les données de la réponse (peut être dans response.data.data ou response.data)
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
        
        console.log(`📊 EtapeAccordion - ${allPieces.length} pièce(s) justificative(s) récupérée(s) au total`);

        // Filtrer pour ne garder que les pièces dont l'ID correspond aux piece_justification_id des documents
        const filteredPieces = allPieces.filter(piece => {
          const pieceId = piece.id;
          const matches = pieceJustificationIds.has(pieceId);
          
          if (matches) {
            console.log(`✅ EtapeAccordion - Pièce justificative trouvée:`, {
              pieceId: piece.id,
              libelle: piece.libelle,
              type_document_id: piece.type_document_id
            });
          }
          
          return matches;
        });

        console.log(`✅ EtapeAccordion - ${filteredPieces.length} pièce(s) justificative(s) filtrée(s) correspondant aux documents`);

        // Créer une Map pour un accès rapide : piece_justification_id -> données de la pièce
        const piecesMap = new Map<string, any>();
        filteredPieces.forEach(piece => {
          // Formater la réponse selon le format attendu
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

        console.log('📊 EtapeAccordion - Map des pièces justificatives créée:', {
          totalPieces: piecesMap.size,
          pieces: Array.from(piecesMap.entries()).map(([id, data]) => ({
            id,
            libelle: data.libelle,
            type_document_id: data.type_document_id
          }))
        });

        setPiecesJustificativesMap(piecesMap);
      } catch (error: any) {
        console.error('❌ EtapeAccordion - Erreur lors de la récupération des pièces justificatives:', {
          error: error.response?.data || error.message,
          errorStatus: error.response?.status
        });
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

  return (
    <Accordion 
      key={etape.id} 
      defaultExpanded={isExpanded}
      sx={{
        border: '1px solid',
        borderColor: etapeStatus.status === 'completed' ? 'success.main' : 
                     etapeStatus.status === 'in_progress' ? 'warning.main' : 'divider',
        borderRadius: 1,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: etapeStatus.status === 'completed' ? 'success.50' : 
                          etapeStatus.status === 'in_progress' ? 'warning.50' : 'background.paper',
          '&:hover': {
            backgroundColor: etapeStatus.status === 'completed' ? 'success.100' : 
                            etapeStatus.status === 'in_progress' ? 'warning.100' : 'action.hover'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', mr: 2 }}>
          {/* Numéro de l'étape */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: etapeStatus.status === 'completed' ? 'success.main' : 
                              etapeStatus.status === 'in_progress' ? 'warning.main' : 'grey.300',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            {index + 1}
          </Box>

          {/* Informations de l'étape */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" className="font-display">
                {etape.libelle}
              </Typography>
              {etape.code && (
                <Chip 
                  label={etape.code} 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              <Chip 
                label={etapeStatus.label}
                size="small"
                color={etapeStatus.color}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            
            {etape.statut_libelle && (
              <Typography variant="caption" color="text.secondary" className="font-primary">
                Statut: {etape.statut_libelle}
              </Typography>
            )}
            
            {etape.roles && etape.roles.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                {etape.roles.map((role, roleIndex) => (
                  <Chip
                    key={roleIndex}
                    label={role}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Icône de statut */}
          {etapeStatus.status === 'completed' ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          ) : etapeStatus.status === 'in_progress' ? (
            <ClockIcon className="w-6 h-6 text-orange-600" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-gray-400" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {/* Informations détaillées de l'étape */}
          <Box>
            <Typography variant="body2" color="text.secondary" className="font-primary" gutterBottom>
              Informations de l'étape
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              {etape.code && (
                <Box>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    Code
                  </Typography>
                  <Typography variant="body2" className="font-primary">
                    {etape.code}
                  </Typography>
                </Box>
              )}
              {etape.statut_libelle && (
                <Box>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    Statut système
                  </Typography>
                  <Typography variant="body2" className="font-primary">
                    {etape.statut_libelle}
                  </Typography>
                </Box>
              )}
              {etape.created_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    Créée le
                  </Typography>
                  <Typography variant="body2" className="font-primary">
                    {new Date(etape.created_at).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Pièces justificatives */}
          {etape.pieces && etape.pieces.length > 0 ? (
            <Box>
              <Typography variant="body2" fontWeight="bold" className="font-display" gutterBottom>
                Pièces justificatives requises ({etape.pieces.length})
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {etape.pieces.map((piece: PieceEtape, pieceIndex: number) => {
                  const pieceJustificationId = piece.type_document;
                  const pieceId = `${etape.id}-${piece.type_document}`;
                  
                  const typeDoc = typeDocuments.find(td => 
                    td.id === piece.type_document || td.name === piece.type_document
                  );
                  const typeDocName = typeDoc?.name || typeDoc?.libelle || piece.libelle || piece.type_document;
                  
                  // Chercher les documents qui correspondent à cette pièce
                  // IMPORTANT: Prendre en compte les documents simulés qui ont déjà le bon piece_justification_id
                  let doc = normalizedDocuments.find(d => {
                    // Filtrer par etape_id si disponible (optimisation)
                    if (d.etape_id && d.etape_id !== etape.id) {
                      return false; // Le document appartient à une autre étape
                    }
                    
                    // Utiliser directement piece_justification_id (déjà normalisé avec le mapping localStorage)
                    const docPieceId = d.piece_justification_id;
                    
                    // Pour les documents simulés, vérifier directement par piece_justification_id
                    // car ils ont déjà le bon ID depuis le mapping localStorage
                    if (d.is_simulated && docPieceId) {
                      if (String(docPieceId) === String(pieceJustificationId)) {
                        console.log('✅ EtapeAccordion - Document simulé trouvé par piece_justification_id:', {
                          pieceTypeDocument: pieceJustificationId,
                          pieceLibelle: piece.libelle,
                          docId: d.id,
                          docNom: d.nom_fichier || d.nom,
                          docPieceId: docPieceId,
                          isSimulated: true,
                          matches: true
                        });
                        return true;
                      }
                    }
                    
                    // Récupérer les données de la PieceJustificative depuis la map locale
                    const pieceJustificativeData = docPieceId ? piecesJustificativesMap.get(docPieceId) : null;
                    const docPieceJustificationLibelle = pieceJustificativeData?.libelle || null;
                    
                    // Récupérer le Referentiel correspondant à pieceJustificationId (qui est le type_document_id)
                    const referentiel = typeDocuments.find(td => td.id === pieceJustificationId);
                    const referentielLibelle = referentiel?.libelle || referentiel?.name || null;
                    
                    // Comparaison par libelle : PieceJustificative.libelle === Referentiel.libelle
                    if (docPieceJustificationLibelle && referentielLibelle && 
                        docPieceJustificationLibelle.toLowerCase().trim() === referentielLibelle.toLowerCase().trim()) {
                      console.log('✅ EtapeAccordion - Document trouvé par libelle:', {
                        pieceTypeDocument: pieceJustificationId,
                        pieceLibelle: piece.libelle,
                        docId: d.id,
                        docNom: d.nom_fichier || d.nom,
                        docPieceJustificationLibelle: docPieceJustificationLibelle,
                        referentielLibelle: referentielLibelle,
                        docPieceId: docPieceId,
                        isSimulated: d.is_simulated,
                        matches: true
                      });
                      return true;
                    }
                    
                    // Fallback: Comparaison directe par piece_justification_id ou type_document_id
                    if (docPieceId && (String(docPieceId) === String(pieceJustificationId) || 
                        d.type_document_id === pieceJustificationId)) {
                      return true;
                    }
                    
                    return false;
                  });
                  
                  // Construire le tableau de documents pour cette pièce (compatible avec PieceCard)
                  const docsForPiece = doc ? [doc] : [];
                  
                  // Log pour déboguer
                  if (doc) {
                    console.log('✅ EtapeAccordion - Document trouvé pour pièce:', {
                      pieceTypeDocument: pieceJustificationId,
                      pieceLibelle: piece.libelle,
                      docId: doc.id,
                      docNom: doc.nom_fichier || doc.nom,
                      docPieceId: doc.piece_justification_id,
                      matches: true
                    });
                  } else {
                    // Log détaillé pour comprendre pourquoi aucun document n'est trouvé
                    const documentsWithPieceIds = normalizedDocuments.map(d => ({
                      id: d.id,
                      nom: d.nom_fichier || d.nom,
                      pieceIdFromAPI: d.piece_justification_id,
                      typeDocumentId: d.type_document_id,
                      etapeId: d.etape_id,
                      matchesPiece: d.piece_justification_id === pieceJustificationId,
                      matchesPieceString: String(d.piece_justification_id) === String(pieceJustificationId)
                    }));
                    
                    console.log('❌ EtapeAccordion - Aucun document trouvé pour pièce:', {
                      pieceTypeDocument: pieceJustificationId,
                      pieceLibelle: piece.libelle,
                      etapeId: etape.id,
                      etapeLibelle: etape.libelle,
                      totalDocuments: normalizedDocuments.length,
                      documentsWithPieceIds: documentsWithPieceIds,
                      comparison: {
                        pieceJustificationId,
                        pieceJustificationIdString: String(pieceJustificationId),
                        documentsPieceIds: documentsWithPieceIds.map(d => ({
                          fromAPI: d.pieceIdFromAPI,
                          matches: d.matchesPiece
                        }))
                      }
                    });
                  }
                  
                  // Utiliser directement docsForPiece (qui inclut déjà le fallback par type_document_id)
                  const docsForType = docsForPiece;
                  
                  const isValidated = isDocumentValidatedForPiece
                    ? isDocumentValidatedForPiece(piece)
                    : docsForPiece.some(doc => doc.valide === true);
                  
                  const isUploading = uploadingForPiece === pieceId || uploading;
                  const isSimulating = isSimulatingForPiece === pieceId;
                  // Pour la première étape, elle est toujours accessible (pas d'étape précédente)
                  // Pour les autres étapes, vérifier si l'étape précédente est complétée
                  const isEtapeAccessible = isFirstEtape || isPreviousEtapeCompleted;
                  
                  return (
                    <PieceCard
                      key={pieceIndex}
                      piece={piece}
                      etape={etape}
                      typeDocName={typeDocName}
                      docsForType={docsForType}
                      isValidated={isValidated}
                      isUploading={isUploading}
                      isEtapeAccessible={isEtapeAccessible}
                      authorized={authorized}
                      dossierId={dossierId}
                      onUpdateDocument={onUpdateDocument}
                      onOpenValidationDialog={onOpenValidationDialog}
                      onUploadClick={() => onUploadForPiece(piece, etape)}
                      onFileSelect={(e) => onFileSelectForPiece(e, piece, etape)}
                      onSimulateUpload={onSimulateUploadForPiece ? () => onSimulateUploadForPiece(piece, etape) : undefined}
                      isSimulating={isSimulating}
                      fileInputRef={(el) => {
                        if (el) {
                          fileInputRefs.current.set(pieceId, el);
                        } else {
                          fileInputRefs.current.delete(pieceId);
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" className="font-primary">
              Aucune pièce justificative requise pour cette étape
            </Typography>
          )}

          {/* Message si l'étape précédente n'est pas complétée */}
          {!isPreviousEtapeCompleted && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" className="font-primary">
                Cette étape est en attente. Veuillez compléter l'étape précédente : <strong>{previousEtape?.libelle}</strong>
              </Typography>
            </Alert>
          )}

          {/* Statut des résultats pour l'étape ENVOI DOSSIER POUR EXAMEN */}
          {isEnvoiDossierExamen && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold" className="font-display">
                  Statut des résultats d'examen
                </Typography>
                {loadingEpreuves ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary" className="font-primary">
                      Chargement du statut...
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Chip
                      label={getStatutLabel(epreuvesStatus)}
                      color={getStatutColor(epreuvesStatus)}
                      size="medium"
                      variant={epreuvesStatus === 'non_saisi' ? 'outlined' : 'filled'}
                    />
                    <Typography variant="body2" color="text.secondary" className="font-primary">
                      {epreuvesStatus === 'reussi' && '✅ Toutes les épreuves sont validées'}
                      {epreuvesStatus === 'echoue' && '❌ Au moins une épreuve est échouée'}
                      {epreuvesStatus === 'absent' && '⚠️ Au moins un candidat est absent'}
                      {epreuvesStatus === 'non_saisi' && '📝 En attente de saisie des résultats'}
                    </Typography>
                  </Box>
                )}
                {!programmeSessionCreated && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2" className="font-primary">
                      Veuillez envoyer le dossier à l'examen pour commencer le processus.
                    </Typography>
                  </Alert>
                )}
                {programmeSessionCreated && epreuvesStatus !== 'reussi' && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" className="font-primary">
                      Le dossier a été envoyé à l'examen. Vous devez attendre que toutes les épreuves soient validées avant de pouvoir passer à l'étape suivante.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            </Box>
          )}

          {/* Bouton pour passer à l'étape suivante ou finaliser la dernière étape */}
          {shouldShowButton && authorized && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" className="font-display" gutterBottom>
                    {isButtonEnabled ? (isLastEtape ? 'Toutes les pièces sont validées - Dernière étape' : 'Toutes les pièces sont validées') : 'En attente de validation des pièces'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    {isLastEtape ? 'Finaliser cette étape' : 'Passer à l\'étape suivante'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {/* Bouton "Envoyer à l'examen" pour l'étape ENVOI DOSSIER POUR EXAMEN */}
                  {isEnvoiDossierExamen && !programmeSessionCreated && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={transmittingEtape === etape.id ? <CircularProgress size={16} /> : <CheckCircleIcon className="w-5 h-5" />}
                      onClick={() => onTransmitToNextEtape(etape)}
                      disabled={transmittingEtape === etape.id || !dossierId || !circuit?.id}
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {transmittingEtape === etape.id ? 'Traitement...' : 'Envoyer à l\'examen'}
                    </Button>
                  )}
                  
                  {/* Bouton "Passer à l'étape suivante" */}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={transmittingEtape === etape.id ? <CircularProgress size={16} /> : <CheckCircleIcon className="w-5 h-5" />}
                    onClick={() => {
                      if (isLastEtape) {
                        onCompleteLastEtape(etape);
                      } else {
                        onTransmitToNextEtape(etape);
                      }
                    }}
                    disabled={
                      !isButtonEnabled || 
                      transmittingEtape === etape.id || 
                      !dossierId || 
                      !circuit?.id ||
                      (isEnvoiDossierExamen && (!programmeSessionCreated || epreuvesStatus !== 'reussi'))
                    }
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      opacity: (isButtonEnabled && (!isEnvoiDossierExamen || (programmeSessionCreated && epreuvesStatus === 'reussi'))) ? 1 : 0.6
                    }}
                  >
                    {transmittingEtape === etape.id 
                      ? 'Traitement...' 
                      : isLastEtape 
                        ? 'Finaliser l\'étape' 
                        : 'Passer à l\'étape suivante'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Message si l'utilisateur n'est pas autorisé */}
          {!authorized && etape.roles && etape.roles.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" className="font-primary">
                Votre rôle ({userRole || 'Non défini'}) ne vous autorise pas à effectuer des actions sur cette étape. 
                Rôles autorisés : {etape.roles.join(', ')}
              </Typography>
            </Alert>
          )}
          
          {/* Message de confirmation si l'étape est complétée */}
          {(computedCompletedEtapes.has(etape.id) || completedEtapes.has(etape.id)) && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <Box>
                  <Typography variant="body2" fontWeight="bold" className="font-display" color="success.main">
                    Étape complétée
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    Cette étape est terminée
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

