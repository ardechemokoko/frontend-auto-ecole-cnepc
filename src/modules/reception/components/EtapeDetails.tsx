import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Cancel,
  Description
} from '@mui/icons-material';
import {
  circuitSuiviService,
  EtapeCircuit,
  Document,
  PieceEtape
} from '../services/circuit-suivi.service';
import axiosClient from '../../../shared/environment/envdev';

interface EtapeDetailsProps {
  etape: EtapeCircuit;
  circuitId: string;
  etapeIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  isBlocked: boolean;
  uploadedDocuments?: Document[];
  dossierId?: string;
  onDocumentUploaded?: () => void;
  onTransitionToNext?: () => void;
}

interface TypeDocument {
  id: string;
  name: string;
  libelle?: string;
}

const EtapeDetails: React.FC<EtapeDetailsProps> = ({
  etape,
  circuitId,
  etapeIndex,
  isActive,
  isCompleted,
  isBlocked,
  uploadedDocuments = [],
  dossierId,
  onDocumentUploaded,
  onTransitionToNext
}) => {
  const [typeDocuments, setTypeDocuments] = useState<TypeDocument[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [commentaires, setCommentaires] = useState('');
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Charger les types de documents
  useEffect(() => {
    const loadTypeDocuments = async () => {
      try {
        setLoadingTypes(true);
        let page = 1;
        let allTypes: TypeDocument[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await axiosClient.get('/referentiels', {
            params: {
              page,
              per_page: 100,
              type_ref: 'type_piece'
            }
          });

          const data = response.data?.data || response.data || [];
          const types = Array.isArray(data) ? data : [];
          allTypes = [...allTypes, ...types];

          hasMore = types.length === 100;
          page++;
        }

        setTypeDocuments(allTypes);
      } catch (err: any) {
        console.error('Erreur lors du chargement des types de documents:', err);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadTypeDocuments();
  }, []);

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const userData = localStorage.getItem('dgtt_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || null);
      } catch (e) {
        console.warn('Impossible de parser user_data');
      }
    }
  }, []);

  // Vérifier si l'utilisateur est autorisé
  const isUserAuthorized = (etapeRoles?: string[]): boolean => {
    if (!etapeRoles || etapeRoles.length === 0) return true;
    if (!userRole) return false;

    const normalizedUserRole = userRole.replace(/^ROLE_/, '').toLowerCase();
    return etapeRoles.some(role => {
      const normalizedRole = role.replace(/^ROLE_/, '').toLowerCase();
      return normalizedRole === normalizedUserRole;
    });
  };

  // Séparer les documents obligatoires et optionnels
  const requiredPieces = etape.pieces?.filter(p => p.obligatoire) || [];
  const optionalPieces = etape.pieces?.filter(p => !p.obligatoire) || [];

  // Vérifier si tous les documents obligatoires sont validés
  const allRequiredDocumentsValidated = requiredPieces.every(piece => {
    const doc = uploadedDocuments.find(d => {
      // Utiliser piece_justification_id en priorité (selon LIAISON_PIECE_DOCUMENT.md)
      const typeMatch = d.piece_justification_id === piece.type_document ||
                       d.type_document_id === piece.type_document ||
                       d.nom_fichier?.toLowerCase().includes(piece.type_document.toLowerCase());
      return typeMatch && d.valide;
    });
    return !!doc;
  });

  // Vérifier si tous les documents obligatoires sont uploadés
  const allRequiredDocumentsUploaded = requiredPieces.every(piece => {
    const doc = uploadedDocuments.find(d => {
      // Utiliser piece_justification_id en priorité (selon LIAISON_PIECE_DOCUMENT.md)
      const typeMatch = d.piece_justification_id === piece.type_document ||
                       d.type_document_id === piece.type_document ||
                       d.nom_fichier?.toLowerCase().includes(piece.type_document.toLowerCase());
      return typeMatch;
    });
    return !!doc;
  });

  const canTransition = allRequiredDocumentsUploaded && 
                        allRequiredDocumentsValidated && 
                        isUserAuthorized(etape.roles) &&
                        !isBlocked;

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !dossierId) return;

    const file = files[0];
    setUploading(true);

    try {
      // Validation du fichier
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        alert('Le fichier ne doit pas dépasser 5 MB');
        setUploading(false);
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format non autorisé. Utilisez PDF, JPG ou PNG');
        setUploading(false);
        return;
      }

      // Upload du document
      await circuitSuiviService.uploadDocument(
        dossierId,
        file,
        selectedDocumentType || undefined,
        commentaires
      );

      // Recharger les documents
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }

      // Émettre l'événement
      window.dispatchEvent(new CustomEvent('documentUploaded', {
        detail: { dossierId }
      }));

      setUploadDialogOpen(false);
      setSelectedDocumentType('');
      setCommentaires('');
      if (fileInputRef) {
        fileInputRef.value = '';
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      alert(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTransmitEtape = async () => {
    if (!canTransition || !dossierId) return;

    try {
      setTransmitting(true);
      const response = await circuitSuiviService.transmettreEtape(
        etape.id,
        circuitId,
        dossierId
      );

      if (response.success) {
        // Émettre l'événement
        window.dispatchEvent(new CustomEvent('etapeTransmise', {
          detail: {
            etapeId: etape.id,
            circuitId,
            dossierId
          }
        }));

        if (onTransitionToNext) {
          onTransitionToNext();
        }

        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la transmission:', error);
      alert(`Erreur lors de la transmission: ${error.message}`);
    } finally {
      setTransmitting(false);
    }
  };

  return (
    <Box>
      {/* En-tête de l'étape */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {etape.libelle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Code: {etape.code}
        </Typography>
        {etape.statut_libelle && (
          <Chip
            label={etape.statut_libelle}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Paper>

      {/* Rôles autorisés */}
      {etape.roles && etape.roles.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Rôles autorisés: {etape.roles.join(', ')}
          {!isUserAuthorized(etape.roles) && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              ⚠️ Vous n'avez pas les permissions nécessaires pour cette étape.
            </Typography>
          )}
        </Alert>
      )}

      {/* Documents obligatoires */}
      {requiredPieces.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Documents obligatoires
          </Typography>
          <List>
            {requiredPieces.map((piece, index) => {
              const doc = uploadedDocuments.find(d => {
                // Utiliser piece_justification_id en priorité (selon LIAISON_PIECE_DOCUMENT.md)
                const typeMatch = d.piece_justification_id === piece.type_document ||
                                 d.type_document_id === piece.type_document ||
                                 d.nom_fichier?.toLowerCase().includes(piece.type_document.toLowerCase());
                return typeMatch;
              });

              return (
                <ListItem key={index}>
                  <ListItemText
                    primary={piece.libelle || piece.type_document}
                    secondary={doc ? (
                      <Box>
                        <Chip
                          icon={doc.valide ? <CheckCircle /> : <Cancel />}
                          label={doc.valide ? 'Validé' : 'En attente de validation'}
                          color={doc.valide ? 'success' : 'warning'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {doc.nom_fichier}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="error">
                        Non uploadé
                      </Typography>
                    )}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Documents optionnels */}
      {optionalPieces.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Documents optionnels
          </Typography>
          <List>
            {optionalPieces.map((piece, index) => {
              const doc = uploadedDocuments.find(d => {
                // Utiliser piece_justification_id en priorité (selon LIAISON_PIECE_DOCUMENT.md)
                const typeMatch = d.piece_justification_id === piece.type_document ||
                                 d.type_document_id === piece.type_document ||
                                 d.nom_fichier?.toLowerCase().includes(piece.type_document.toLowerCase());
                return typeMatch;
              });

              return (
                <ListItem key={index}>
                  <ListItemText
                    primary={piece.libelle || piece.type_document}
                    secondary={doc ? (
                      <Box>
                        <Chip
                          icon={doc.valide ? <CheckCircle /> : <Cancel />}
                          label={doc.valide ? 'Validé' : 'En attente de validation'}
                          color={doc.valide ? 'success' : 'warning'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {doc.nom_fichier}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Non uploadé
                      </Typography>
                    )}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Tous les documents uploadés */}
      {uploadedDocuments.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Tous les documents
          </Typography>
          <List>
            {uploadedDocuments.map((doc) => (
              <ListItem key={doc.id}>
                <Description sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary={doc.nom_fichier}
                  secondary={
                    <Box>
                      <Chip
                        icon={doc.valide ? <CheckCircle /> : <Cancel />}
                        label={doc.valide ? 'Validé' : 'En attente de validation'}
                        color={doc.valide ? 'success' : 'warning'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {doc.created_at && (
                        <Typography variant="caption" color="text.secondary">
                          Uploadé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={handleUploadClick}
          disabled={!dossierId || uploading}
        >
          Ajouter un document
        </Button>

        {canTransition && (
          <Button
            variant="contained"
            onClick={handleTransmitEtape}
            disabled={transmitting}
          >
            {transmitting ? <CircularProgress size={20} /> : 'Passer à l\'étape suivante'}
          </Button>
        )}
      </Box>

      {/* Alerte de transition */}
      {!canTransition && requiredPieces.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {!allRequiredDocumentsUploaded && 'Tous les documents obligatoires doivent être uploadés. '}
          {allRequiredDocumentsUploaded && !allRequiredDocumentsValidated && 'Tous les documents obligatoires doivent être validés. '}
          {!isUserAuthorized(etape.roles) && 'Vous n\'avez pas les permissions nécessaires. '}
          {isBlocked && 'Cette étape est bloquée.'}
        </Alert>
      )}

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Type de document</InputLabel>
            <Select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              label="Type de document"
            >
              {typeDocuments.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name || type.libelle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Commentaires (optionnel)"
            multiline
            rows={3}
            value={commentaires}
            onChange={(e) => setCommentaires(e.target.value)}
            sx={{ mb: 2 }}
          />
          <input
            type="file"
            ref={(ref) => setFileInputRef(ref)}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => fileInputRef?.click()}
            disabled={uploading}
            startIcon={<Upload />}
          >
            {uploading ? <CircularProgress size={20} /> : 'Sélectionner un fichier'}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EtapeDetails;

