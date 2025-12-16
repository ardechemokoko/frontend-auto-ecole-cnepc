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
import { getEtapeStatus, areAllPiecesValidated, getPreviousEtape, getNextEtape } from '../utils/etapeHelpers';
import { EtapeAccordion } from './EtapeAccordion';
import { ValidationDialog } from './ValidationDialog';
import { CNEDDTButton } from './CNEDDTButton';

const CircuitEtapesCard: React.FC<CircuitEtapesCardProps> = ({
  circuit,
  loadingCircuit,
  loadingTypeDocuments,
  typeDocuments,
  documentsFromApi,
  isDocumentValidatedForPiece,
  dossierId,
  onDocumentUploaded,
  uploading = false,
  onUpdateDocument,
  onAllEtapesCompletedChange,
  epreuvesStatus,
  loadingEpreuves = false,
  onSendToCNEDDT
}) => {
  // Filtrer les documents pour ne garder que ceux du dossier actuel
  const documentsForCurrentDossier = useMemo(() => {
    if (!dossierId) return documentsFromApi;
    
    return documentsFromApi.filter(doc => {
      return !doc.documentable_id || doc.documentable_id === dossierId;
    });
  }, [documentsFromApi, dossierId]);

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

  // Hook pour gérer la complétion des étapes
  const {
    completedEtapes,
    computedCompletedEtapes,
    etapesCompletes,
    allEtapesCompleted,
    progression,
    markEtapeAsCompleted
  } = useEtapeCompletion(etapes, circuit, documentsForCurrentDossier, dossierId);

  // Hook pour gérer l'upload de documents
  const {
    uploadingForPiece,
    fileInputRefs,
    handleUploadForPiece,
    handleFileSelectForPiece
  } = useDocumentUploadForPiece(dossierId, onDocumentUploaded);

  // Hook pour gérer la transmission entre étapes
  const {
    transmittingEtape,
    handleCompleteLastEtape,
    handleTransmitToNextEtape
  } = useEtapeTransmission(circuit, dossierId, onDocumentUploaded, markEtapeAsCompleted);

  // Hook pour gérer l'envoi à CNEDDT
  const {
    sendingToCNEDDT,
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
  const isPreviousEtapeCompleted = (etape: EtapeCircuit): boolean => {
    const previousEtape = getPreviousEtape(etape, circuit);
    if (!previousEtape) {
      return true; // Pas d'étape précédente
    }

    if (computedCompletedEtapes.has(previousEtape.id) || completedEtapes.has(previousEtape.id)) {
      return true;
    }

    if (!previousEtape.pieces || previousEtape.pieces.length === 0) {
      return computedCompletedEtapes.has(previousEtape.id) || completedEtapes.has(previousEtape.id);
    }

    // Pour les étapes avec pièces, vérifier si toutes les pièces sont validées
    const allPiecesValidated = previousEtape.pieces.every(piece => {
      const docsForPiece = documentsForCurrentDossier.filter(doc => 
        doc.piece_justification_id === piece.type_document
      );
      return docsForPiece.length > 0 && docsForPiece.some(doc => doc.valide === true);
    });

    return allPiecesValidated;
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
              computedCompletedEtapes
            );
            
            const etapeStatus = getEtapeStatus(
              etape,
              previousCompleted,
              computedCompletedEtapes,
              completedEtapes,
              documentsForCurrentDossier
            );

            // Logique pour déterminer si le bouton doit être affiché
            const shouldShow = !isEtapeCompleted && 
              ((previousCompleted || isFirstEtape) || (isLastEtape && allValidated)) && 
              (!!nextEtape || isLastEtape);
            
            const isButtonEnabled = allValidated || isEtapeWithoutPieces;

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
                fileInputRefs={fileInputRefs}
                onCompleteLastEtape={handleCompleteLastEtape}
                onTransmitToNextEtape={handleTransmitToNextEtape}
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
    </Card>
  );
};

export default CircuitEtapesCard;
