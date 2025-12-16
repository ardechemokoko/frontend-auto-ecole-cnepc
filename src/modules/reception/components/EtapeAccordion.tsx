import React from 'react';
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
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { EtapeCircuit, PieceEtape } from '../services/circuit-suivi.service';
import { EtapeStatus } from '../types/circuit-etapes.types';
import { PieceCard } from './PieceCard';
import { getPreviousEtape } from '../utils/etapeHelpers';

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
  fileInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  onCompleteLastEtape: (etape: EtapeCircuit) => void;
  onTransmitToNextEtape: (etape: EtapeCircuit) => void;
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
  fileInputRefs,
  onCompleteLastEtape,
  onTransmitToNextEtape
}) => {
  const previousEtape = getPreviousEtape(etape, circuit);
  const isExpanded = index === 0;

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
                  
                  const docsForPiece = documentsForCurrentDossier.filter(doc => 
                    doc.piece_justification_id === pieceJustificationId
                  );
                  
                  const docsForType = docsForPiece.length > 0 
                    ? docsForPiece 
                    : documentsForCurrentDossier.filter(doc => doc.type_document_id === piece.type_document);
                  
                  const isValidated = isDocumentValidatedForPiece
                    ? isDocumentValidatedForPiece(piece)
                    : docsForPiece.some(doc => doc.valide === true);
                  
                  const isUploading = uploadingForPiece === pieceId || uploading;
                  const isEtapeAccessible = isPreviousEtapeCompleted;
                  
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
                      dossierId={dossierId}
                      onUpdateDocument={onUpdateDocument}
                      onOpenValidationDialog={onOpenValidationDialog}
                      onUploadClick={() => onUploadForPiece(piece, etape)}
                      onFileSelect={(e) => onFileSelectForPiece(e, piece, etape)}
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

          {/* Bouton pour passer à l'étape suivante ou finaliser la dernière étape */}
          {shouldShowButton && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold" className="font-display" gutterBottom>
                    {isButtonEnabled ? (isLastEtape ? 'Toutes les pièces sont validées - Dernière étape' : 'Toutes les pièces sont validées') : 'En attente de validation des pièces'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    {isLastEtape ? 'Finaliser cette étape' : 'Passer à l\'étape suivante'}
                  </Typography>
                </Box>
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
                  disabled={!isButtonEnabled || transmittingEtape === etape.id || !dossierId || !circuit?.id}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    opacity: isButtonEnabled ? 1 : 0.6
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

