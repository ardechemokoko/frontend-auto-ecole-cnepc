import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Stack,
  Tooltip,
  LinearProgress,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Switch, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { CircuitSuivi, EtapeCircuit, PieceEtape } from '../services/circuit-suivi.service';

interface DocumentsCardProps {
  documentsFromApi: any[];
  loadingDocuments: boolean;
  uploading: boolean;
  dossierId?: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDocument: (document: any) => void;
  onDownloadDocument: (document: any) => void;
  onUpdateDocument?: (documentId: string, data: { valide: boolean; commentaires?: string }) => Promise<void>;
  formatFileSize: (bytes: number) => string;
  circuit?: CircuitSuivi | null;
  typeDocuments?: any[];
}

const DocumentsCard: React.FC<DocumentsCardProps> = ({
  documentsFromApi,
  loadingDocuments,
  uploading,
  dossierId,
  fileInputRef,
  onUploadClick,
  onFileSelect,
  onViewDocument,
  onDownloadDocument,
  onUpdateDocument,
  formatFileSize,
  circuit,
  typeDocuments = []
}) => {
  const [validationDialog, setValidationDialog] = React.useState<{
    open: boolean;
    document: any | null;
    valide: boolean;
    commentaires: string;
  }>({
    open: false,
    document: null,
    valide: false,
    commentaires: ''
  });
  const [updatingDocument, setUpdatingDocument] = React.useState<string | null>(null);

  // Filtrer les documents pour ne garder que ceux du dossier actuel
  // Le champ documentable_id correspond à l'ID du dossier
  const documentsForCurrentDossier = React.useMemo(() => {
    if (!dossierId) {
      // Si pas de dossierId, retourner tous les documents (compatibilité)
      return documentsFromApi;
    }
    
    // Filtrer par documentable_id pour s'assurer que seuls les documents du dossier actuel sont affichés
    const filtered = documentsFromApi.filter(doc => {
      // Si le document a un documentable_id, vérifier qu'il correspond au dossier actuel
      // Sinon, garder le document (pour compatibilité avec les anciens documents)
      const matches = !doc.documentable_id || doc.documentable_id === dossierId;
      
      if (!matches && doc.documentable_id) {
        console.log('🔍 Document filtré (appartient à un autre dossier):', {
          docId: doc.id,
          docNom: doc.nom || doc.nom_fichier,
          documentable_id: doc.documentable_id,
          currentDossierId: dossierId
        });
      }
      
      return matches;
    });
    
    console.log('📋 Documents filtrés pour le dossier:', {
      dossierId,
      totalDocuments: documentsFromApi.length,
      filteredDocuments: filtered.length,
      filteredOut: documentsFromApi.length - filtered.length
    });
    
    return filtered;
  }, [documentsFromApi, dossierId]);

  // Fonction pour ouvrir le dialogue de validation
  const handleOpenValidationDialog = (doc: any) => {
    setValidationDialog({
      open: true,
      document: doc,
      valide: doc.valide || false,
      commentaires: doc.commentaires || ''
    });
  };

  // Fonction pour fermer le dialogue
  const handleCloseValidationDialog = () => {
    setValidationDialog({
      open: false,
      document: null,
      valide: false,
      commentaires: ''
    });
  };

  // Fonction pour sauvegarder la validation
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

  // Fonction utilitaire pour vérifier si une chaîne est un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fonction pour résoudre l'ID du type de document selon CORRELATION_DOCUMENTS_PIECES.md
  const getTypeDocumentId = (typeDocumentIdentifier: string): string | null => {
    if (!typeDocumentIdentifier) return null;

    // 1. Si c'est déjà un UUID, l'utiliser directement
    if (isUUID(typeDocumentIdentifier)) {
      return typeDocumentIdentifier;
    }

    // 2. Sinon, chercher par libellé, code ou name
    const typeDoc = typeDocuments.find(
      td => 
        td.id === typeDocumentIdentifier ||
        td.libelle?.toLowerCase() === typeDocumentIdentifier.toLowerCase() ||
        td.code?.toLowerCase() === typeDocumentIdentifier.toLowerCase() ||
        td.name?.toLowerCase() === typeDocumentIdentifier.toLowerCase()
    );
    
    return typeDoc?.id || null;
  };

  // Fonction pour trouver la pièce et l'étape correspondant à un document
  // Selon LIAISON_PIECE_DOCUMENT.md : liaison principale par piece_justification_id
  const findDocumentCorrelation = (doc: any): { etape: EtapeCircuit | null; piece: PieceEtape | null; typeDoc: any } => {
    if (!circuit) {
      return { etape: null, piece: null, typeDoc: null };
    }

    // Méthode principale : par piece_justification_id (recommandée selon LIAISON_PIECE_DOCUMENT.md)
    if (doc.piece_justification_id) {
      for (const etape of circuit.etapes || []) {
        if (etape.pieces) {
          for (const piece of etape.pieces) {
            // Selon LIAISON_PIECE_DOCUMENT.md : piece.type_document = PieceJustificative.id
            // Comparer directement et aussi via getTypeDocumentId pour gérer les cas où piece.type_document est un UUID ou un libellé
            const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
            if (piece.type_document === doc.piece_justification_id || 
                pieceTypeDocumentId === doc.piece_justification_id) {
              const docTypeDoc = typeDocuments.find(td => td.id === doc.type_document_id);
              // Chercher aussi le typeDoc par piece_justification_id dans les référentiels
              const pieceTypeDoc = typeDocuments.find(td => td.id === doc.piece_justification_id);
              console.log('✅ Corrélation trouvée par piece_justification_id:', {
                doc: doc.nom || doc.nom_fichier,
                piece_justification_id: doc.piece_justification_id,
                etape: etape.libelle,
                piece: piece.libelle || piece.type_document,
                pieceTypeDoc: pieceTypeDoc?.libelle || pieceTypeDoc?.name
              });
              return { etape, piece, typeDoc: pieceTypeDoc || docTypeDoc };
            }
          }
        }
      }
    }

    // Méthode secondaire (fallback) : par type_document_id
    if (doc.type_document_id) {
      const docTypeDoc = typeDocuments.find(td => td.id === doc.type_document_id);
      
      for (const etape of circuit.etapes || []) {
        if (etape.pieces) {
          for (const piece of etape.pieces) {
            // Résoudre l'ID du type de document de la pièce
            const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
            
            // Corrélation : doc.type_document_id === pieceTypeDocumentId
            if (pieceTypeDocumentId && doc.type_document_id === pieceTypeDocumentId) {
              console.log('✅ Corrélation trouvée par type_document_id (fallback):', {
                doc: doc.nom,
                docTypeId: doc.type_document_id,
                pieceType: piece.type_document,
                pieceTypeResolved: pieceTypeDocumentId,
                etape: etape.libelle,
                piece: piece.libelle || piece.type_document
              });
              return { etape, piece, typeDoc: docTypeDoc };
            }
          }
        }
      }
    }

    console.log('⚠️ Aucune corrélation trouvée pour le document:', doc.id, doc.nom, {
      piece_justification_id: doc.piece_justification_id || 'N/A',
      type_document_id: doc.type_document_id || 'N/A'
    });
    return { etape: null, piece: null, typeDoc: null };
  };

  // Fonction pour obtenir le nom de la pièce à partir du piece_justification_id ou type_document_id
  const getPieceNameFromDocument = React.useCallback((doc: any): string | null => {
    // 1. Priorité : chercher par piece_justification_id dans les référentiels (typeDocuments)
    if (doc.piece_justification_id) {
      const pieceDoc = typeDocuments.find(td => td.id === doc.piece_justification_id);
      if (pieceDoc) {
        return pieceDoc.libelle || pieceDoc.name || pieceDoc.code || null;
      }
      
      // Si pas trouvé dans typeDocuments, chercher dans les pièces du circuit
      if (circuit) {
        for (const etape of circuit.etapes || []) {
          if (etape.pieces) {
            for (const piece of etape.pieces) {
              // piece.type_document devrait correspondre à piece_justification_id
              const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
              if (pieceTypeDocumentId === doc.piece_justification_id || piece.type_document === doc.piece_justification_id) {
                return piece.libelle || null;
              }
            }
          }
        }
      }
    }

    // 2. Fallback : chercher par type_document_id
    if (doc.type_document_id) {
      const typeDoc = typeDocuments.find(td => td.id === doc.type_document_id);
      if (typeDoc) {
        return typeDoc.libelle || typeDoc.name || typeDoc.code || null;
      }

      // Si pas trouvé, chercher dans les pièces du circuit
      if (circuit) {
        for (const etape of circuit.etapes || []) {
          if (etape.pieces) {
            for (const piece of etape.pieces) {
              const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
              if (pieceTypeDocumentId === doc.type_document_id) {
                return piece.libelle || null;
              }
            }
          }
        }
      }
    }

    return null;
  }, [typeDocuments, circuit]);

  // Grouper les documents par étape (utiliser les documents filtrés)
  const documentsByEtape = React.useMemo(() => {
    const grouped = new Map<string, { etape: EtapeCircuit; documents: any[] }>();
    const uncorrelated: any[] = [];

    documentsForCurrentDossier.forEach(doc => {
      const { etape, piece } = findDocumentCorrelation(doc);
      
      if (etape && piece) {
        const key = etape.id;
        if (!grouped.has(key)) {
          grouped.set(key, { etape, documents: [] });
        }
        grouped.get(key)!.documents.push({ ...doc, piece });
      } else {
        // Même pour les documents non corrélés, essayer de trouver le nom de la pièce
        // Utiliser piece_justification_id en priorité, puis type_document_id
        const pieceName = getPieceNameFromDocument(doc);
        uncorrelated.push({ ...doc, pieceName });
        
        // Log pour débogage si pas de nom trouvé
        if (!pieceName && (doc.piece_justification_id || doc.type_document_id)) {
          console.warn('⚠️ Document non corrélé et nom de pièce non trouvé:', {
            docId: doc.id,
            docNom: doc.nom || doc.nom_fichier,
            piece_justification_id: doc.piece_justification_id || 'N/A',
            type_document_id: doc.type_document_id || 'N/A',
            circuit: circuit ? 'présent' : 'absent',
            typeDocumentsCount: typeDocuments.length
          });
        }
      }
    });

    return { grouped, uncorrelated };
  }, [documentsForCurrentDossier, circuit, typeDocuments, getPieceNameFromDocument]);
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
            <Typography variant="h6" fontWeight="bold" className="font-display">
              Documents ({documentsForCurrentDossier.length})
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudArrowUpIcon className="w-4 h-4" />}
            onClick={onUploadClick}
            disabled={uploading || !dossierId}
            className="font-primary"
          >
            {uploading ? 'Upload...' : 'Ajouter un document'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={onFileSelect}
          />
        </Box>

        {(loadingDocuments || uploading) && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" className="font-primary">
              {uploading ? 'Upload en cours...' : 'Chargement des documents...'}
            </Typography>
          </Box>
        )}

        {/* Documents existants groupés par étape */}
        {documentsForCurrentDossier.length > 0 ? (
          <Stack spacing={3}>
            {/* Documents corrélés avec les étapes */}
            {Array.from(documentsByEtape.grouped.entries()).map(([etapeId, { etape, documents }]) => (
              <Box key={etapeId}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" className="font-display" sx={{ mr: 1 }}>
                    {etape.libelle}
                  </Typography>
                  {etape.code && (
                    <Chip label={etape.code} size="small" variant="outlined" sx={{ mr: 1 }} />
                  )}
                  <Chip 
                    label={`${documents.length} document(s)`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
                <Stack spacing={1.5}>
                  {documents.map((doc: any) => {
                    const { piece, typeDoc } = findDocumentCorrelation(doc);
                    // Chercher le nom de la pièce : d'abord dans typeDoc, puis dans piece, puis via getPieceNameFromDocument
                    let pieceName = typeDoc?.libelle || typeDoc?.name || typeDoc?.code;
                    if (!pieceName && piece) {
                      pieceName = piece.libelle;
                    }
                    if (!pieceName) {
                      // Fallback : chercher dans les référentiels par piece_justification_id
                      pieceName = getPieceNameFromDocument(doc);
                    }
                    if (!pieceName) {
                      pieceName = 'Document';
                    }
                    
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: doc.valide ? 'success.main' : 'divider',
                          borderRadius: 1,
                          backgroundColor: doc.valide ? 'success.50' : 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" fontWeight="medium" className="font-primary">
                                {doc.nom || doc.nom_fichier}
                              </Typography>
                              {doc.valide && (
                                <Chip 
                                  label="Validé" 
                                  size="small" 
                                  color="success" 
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {piece?.obligatoire && (
                                <Chip 
                                  label="Obligatoire" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip 
                                label={pieceName || 'Pièce non identifiée'} 
                                size="small" 
                                color={pieceName ? 'primary' : 'default'}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary" className="font-primary">
                                Pièce justificative
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" className="font-primary">
                              Taille: {doc.taille}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" className="font-primary">
                              Uploadé le {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                            <Tooltip title="Voir le document">
                              <IconButton
                                size="small"
                                onClick={() => onViewDocument(doc)}
                                color="primary"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Télécharger">
                              <IconButton
                                size="small"
                                onClick={() => onDownloadDocument(doc)}
                                color="secondary"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ))}

            {/* Documents non corrélés */}
            {documentsByEtape.uncorrelated.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" className="font-display" sx={{ mr: 1 }}>
                    Documents non corrélés
                  </Typography>
                  <Chip 
                    label={`${documentsByEtape.uncorrelated.length} document(s)`} 
                    size="small" 
                    color="default" 
                    variant="outlined" 
                  />
                </Box>
                <Stack spacing={1.5}>
                  {documentsByEtape.uncorrelated.map((doc: any) => {
                    const pieceName = doc.pieceName || getPieceNameFromDocument(doc);
                    
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          opacity: pieceName ? 1 : 0.7
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" fontWeight="medium" className="font-primary">
                                {doc.nom || doc.nom_fichier}
                              </Typography>
                              {doc.valide && (
                                <Chip 
                                  label="Validé" 
                                  size="small" 
                                  color="success" 
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            {pieceName ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip 
                                  label={pieceName} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                                <Typography variant="caption" color="text.secondary" className="font-primary">
                                  Pièce justificative
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="warning.main" className="font-primary" display="block" sx={{ mb: 0.5 }}>
                                ⚠️ Pièce non identifiée
                                {doc.type_document_id && ` (Type ID: ${doc.type_document_id.substring(0, 8)}...)`}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" className="font-primary">
                              Taille: {doc.taille}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" className="font-primary">
                              Uploadé le {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                            <Tooltip title="Voir le document">
                              <IconButton
                                size="small"
                                onClick={() => onViewDocument(doc)}
                                color="primary"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Télécharger">
                              <IconButton
                                size="small"
                                onClick={() => onDownloadDocument(doc)}
                                color="secondary"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            {onUpdateDocument && (
                              <Tooltip title={doc.valide ? "Document validé - Cliquer pour modifier" : "Valider le document"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenValidationDialog(doc)}
                                  color={doc.valide ? "success" : "default"}
                                  disabled={updatingDocument === doc.id}
                                >
                                  {doc.valide ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                  ) : (
                                    <XCircleIcon className="w-4 h-4" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <Typography variant="h6" color="text.secondary" gutterBottom className="font-display">
              Aucun document disponible
            </Typography>
          </Box>
        )}

        {/* Dialogue de validation */}
        <Dialog
          open={validationDialog.open}
          onClose={handleCloseValidationDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {validationDialog.document && (
              <>Modifier le statut : {validationDialog.document.nom || validationDialog.document.nom_fichier}</>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1" className="font-primary">
                  Statut de validation
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color={validationDialog.valide ? 'success.main' : 'text.secondary'}>
                    {validationDialog.valide ? 'Validé' : 'Non validé'}
                  </Typography>
                  <Switch
                    checked={validationDialog.valide}
                    onChange={(e) => setValidationDialog(prev => ({ ...prev, valide: e.target.checked }))}
                    color="success"
                  />
                </Box>
              </Box>
              <TextField
                label="Commentaires"
                multiline
                rows={4}
                value={validationDialog.commentaires}
                onChange={(e) => setValidationDialog(prev => ({ ...prev, commentaires: e.target.value }))}
                placeholder="Ajouter des commentaires sur ce document..."
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseValidationDialog} color="inherit">
              Annuler
            </Button>
            <Button
              onClick={handleSaveValidation}
              variant="contained"
              color="primary"
              disabled={updatingDocument !== null}
            >
              {updatingDocument ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DocumentsCard;

