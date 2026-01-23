import React, { useState } from 'react';
import { Box, Typography, Paper, Card, CardContent, Chip, CircularProgress, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Description, Download, Close } from '@mui/icons-material';
import { Dossier } from '../../../types/auto-ecole';
import { Document, PieceJustificative } from '../types';
import { getTypePermisLabel, getTypeDemandeName, formatDate } from '../utils';

interface DocumentsListProps {
  documents: Document[];
  piecesJustificativesMap: Map<string, PieceJustificative>;
  candidatDossiers: Dossier[];
  selectedDossierId?: string;
  initialId?: string;
  loadingDossiers: boolean;
  referentielsCache: Map<string, any>;
  typeDemandeCache: Map<string, any>;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  piecesJustificativesMap,
  candidatDossiers,
  selectedDossierId,
  initialId,
  loadingDossiers,
  referentielsCache,
  typeDemandeCache,
}) => {
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const currentDossierId = selectedDossierId || initialId;
  
  const documentsForCurrentDossier = documents.filter((doc) => {
    const docDossierId = doc.documentable_id || (doc as any).dossier_id;
    return String(docDossierId) === String(currentDossierId);
  });
  
  const dossierInfo = candidatDossiers.find(d => d.id === currentDossierId);
  const dossierTypePermis = dossierInfo ? getTypePermisLabel(dossierInfo, referentielsCache) : 'N/A';
  const dossierTypeDemande = dossierInfo ? getTypeDemandeName(dossierInfo, typeDemandeCache) : 'N/A';

  return (
    <Paper
      sx={{
        width: 350,
        minWidth: 350,
        height: '90%',
        overflowY: 'auto',
        borderLeft: 0,
        borderColor: 'none',
        p: 2,
        backgroundColor: 'transparent',
        borderRadius: 0,
      }}
      elevation={5}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Archive
      </Typography>
      
      {loadingDossiers ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {currentDossierId && (
            <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                {dossierTypeDemande}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                {dossierTypePermis}
              </Typography>
              <Chip
                label={`${documentsForCurrentDossier.length} document(s)`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
          
          {documentsForCurrentDossier.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {documentsForCurrentDossier.map((doc) => {
                const pieceJustificative = doc.piece_justification_id 
                  ? piecesJustificativesMap.get(doc.piece_justification_id)
                  : null;
                
                return (
                  <Card key={doc.id} elevation={5} sx={{ backgroundColor: 'transparent', borderRadius: 0 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                        <Description color="primary" sx={{ mt: 0.5, fontSize: 18 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {doc.nom_fichier || 'Document'}
                          </Typography>
                          {pieceJustificative && (
                            <Chip
                              label={pieceJustificative.libelle}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 0.5, fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                          {!pieceJustificative && doc.type_document && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              {typeof doc.type_document === 'string' 
                                ? doc.type_document 
                                : doc.type_document.libelle || doc.type_document.nom || 'N/A'}
                            </Typography>
                          )}
                          {doc.documentable_id && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              Dossier ID: {doc.documentable_id.substring(0, 8)}...
                            </Typography>
                          )}
                          {doc.date_upload && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatDate(doc.date_upload)}
                            </Typography>
                          )}
                        </Box>
                        {doc.valide !== undefined && (
                          <Chip
                            label={doc.valide ? 'Validé' : 'En attente'}
                            color={doc.valide ? 'success' : 'warning'}
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        )}
                      </Box>
                      {doc.chemin_fichier && (
                        <Button
                          size="small"
                          startIcon={<Download />}
                          sx={{ mt: 1, fontSize: '0.7rem' }}
                          onClick={() => {
                            const fileUrl = doc.chemin_fichier;
                            if (fileUrl) {
                              // Vérifier si c'est un PDF pour l'ouvrir dans le viewer intégré
                              const isPdf = fileUrl.toLowerCase().endsWith('.pdf') || 
                                          doc.nom_fichier?.toLowerCase().endsWith('.pdf');
                              
                              if (isPdf) {
                                // Ouvrir dans le viewer PDF intégré
                                setSelectedDocument(doc);
                                setPdfViewerOpen(true);
                              } else {
                                // Pour les autres types de fichiers, télécharger
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.download = doc.nom_fichier || 'document';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }
                          }}
                        >
                          {doc.chemin_fichier?.toLowerCase().endsWith('.pdf') || 
                           doc.nom_fichier?.toLowerCase().endsWith('.pdf') 
                            ? 'Ouvrir' 
                            : 'Télécharger'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {currentDossierId ? 'Aucun document pour ce dossier' : 'Sélectionnez un dossier pour voir ses documents'}
            </Typography>
          )}
        </Box>
      )}
      
      {/* Dialog pour le viewer PDF intégré */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">
            {selectedDocument?.nom_fichier || 'Document PDF'}
          </Typography>
          <IconButton
            onClick={() => setPdfViewerOpen(false)}
            size="small"
            sx={{ ml: 2 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
          {selectedDocument?.chemin_fichier && (
            <Box
              component="iframe"
              src={selectedDocument.chemin_fichier}
              sx={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
              title={selectedDocument.nom_fichier || 'Document PDF'}
            />
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default DocumentsList;

