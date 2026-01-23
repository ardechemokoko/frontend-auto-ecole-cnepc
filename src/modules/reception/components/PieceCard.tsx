import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { CloudArrowUpIcon, CheckBadgeIcon, BeakerIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { PieceEtape, EtapeCircuit } from '../services/circuit-suivi.service';

interface PieceCardProps {
  piece: PieceEtape;
  etape: EtapeCircuit;
  typeDocName: string;
  docsForType: any[];
  isValidated: boolean;
  isUploading: boolean;
  isEtapeAccessible: boolean;
  authorized?: boolean;
  dossierId?: string;
  onUpdateDocument?: (documentId: string, data: { valide: boolean; commentaires?: string }) => Promise<void>;
  onOpenValidationDialog: (doc: any) => void;
  onUploadClick: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  onSimulateUpload?: () => void;
  isSimulating?: boolean;
}

export const PieceCard: React.FC<PieceCardProps> = ({
  piece,
  etape,
  typeDocName,
  docsForType,
  isValidated,
  isUploading,
  isEtapeAccessible,
  authorized = true,
  dossierId,
  onUpdateDocument,
  onOpenValidationDialog,
  onUploadClick,
  onFileSelect,
  fileInputRef,
  onSimulateUpload,
  isSimulating = false
}) => {
  // Log pour déboguer l'affichage du bouton d'upload
  React.useEffect(() => {
    const shouldShowButton = dossierId && authorized && isEtapeAccessible;
    console.log('📤 PieceCard - Affichage bouton upload:', {
      pieceType: typeDocName,
      etapeId: etape.id,
      etapeLibelle: etape.libelle,
      etapeRoles: etape.roles,
      dossierId: !!dossierId,
      authorized,
      isEtapeAccessible,
      shouldShowButton
    });
  }, [dossierId, authorized, isEtapeAccessible, etape.id, etape.libelle, etape.roles, typeDocName]);
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: isValidated ? 'success.main' : piece.obligatoire ? 'error.main' : 'warning.main',
        borderRadius: 1,
        backgroundColor: isValidated ? 'success.50' : piece.obligatoire ? 'error.50' : 'warning.50',
        opacity: isEtapeAccessible ? 1 : 0.6
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight="medium" className="font-primary">
              {typeDocName}
            </Typography>
            {piece.obligatoire && (
              <Chip 
                label="Obligatoire" 
                size="small" 
                color="error"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            )}
            {isValidated && (
              <Chip 
                label="Validé" 
                size="small" 
                color="success"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
            )}
          </Box>
          {docsForType.length > 0 ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {docsForType.map((doc: any) => (
                <Box key={doc.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Typography variant="caption" className="font-primary">
                      • {doc.nom || doc.nom_fichier}
                    </Typography>
                    {doc.valide ? (
                      <Chip 
                        label="Validé" 
                        size="small" 
                        color="success"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    ) : (
                      <Chip 
                        label="En attente" 
                        size="small" 
                        color="warning"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  {onUpdateDocument && authorized && (
                    <Tooltip title={isEtapeAccessible ? "Modifier le statut de validation" : "Complétez d'abord l'étape précédente"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onOpenValidationDialog(doc)}
                          disabled={!isEtapeAccessible}
                          sx={{ 
                            p: 0.5,
                            color: doc.valide ? 'success.main' : 'warning.main',
                            opacity: isEtapeAccessible ? 1 : 0.5
                          }}
                        >
                          <CheckBadgeIcon className="w-4 h-4" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary" className="font-primary">
              Aucun document fourni
            </Typography>
          )}
        </Box>
        {/* Afficher le bouton d'upload si :
            - dossierId existe
            - l'utilisateur est autorisé (authorized)
            - l'étape est accessible (isEtapeAccessible)
            - L'étape n'est pas réservée uniquement aux candidats OU l'utilisateur est autorisé pour cette étape
        */}
        {dossierId && authorized && isEtapeAccessible && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={onFileSelect}
              disabled={!isEtapeAccessible}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={isEtapeAccessible ? `Uploader un document pour ${typeDocName}` : "Complétez d'abord l'étape précédente"}>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={isUploading ? <CircularProgress size={14} /> : <CloudArrowUpIcon className="w-4 h-4" />}
                    onClick={onUploadClick}
                    disabled={!isEtapeAccessible || isUploading || !dossierId}
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1.5,
                      opacity: isEtapeAccessible ? 1 : 0.6
                    }}
                  >
                    {isUploading ? 'Upload...' : 'Upload'}
                  </Button>
                </span>
              </Tooltip>
              {onSimulateUpload && (
                <Tooltip title="Agent Televersement">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      startIcon={isSimulating ? <CircularProgress size={14} /> : <WrenchScrewdriverIcon className="w-4 h-4" />}
                      onClick={onSimulateUpload}
                      disabled={!isEtapeAccessible || isSimulating || isUploading || !dossierId}
                      sx={{ 
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 1.5,
                        opacity: isEtapeAccessible ? 1 : 0.6,
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          backgroundColor: 'warning.50'
                        }
                      }}
                    >
                      {isSimulating ? 'Téléversement...' : 'Agent Televersement'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

