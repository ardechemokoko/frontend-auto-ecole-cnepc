import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Card,
  CardContent,
  Button,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
// Heroicons imports
import { 
  XMarkIcon, 
  UserIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  EyeIcon,
  CloudArrowUpIcon, 
  TrashIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { EleveValide } from '../services/validationService';
import DossierCompletionSheet from './DossierCompletionSheet';

interface EleveDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  eleve: EleveValide | null;
}

const EleveDetailsSheet: React.FC<EleveDetailsSheetProps> = ({
  open,
  onClose,
  eleve
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [replacingDocumentId, setReplacingDocumentId] = useState<string | null>(null);
  const [completionSheetOpen, setCompletionSheetOpen] = useState(false);

  if (!eleve) return null;

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'validated': return 'success';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'validated': return 'Validé';
      default: return 'Inconnu';
    }
  };


  const handleViewDocument = (document: any) => {
    // Si le document a un fichier (document uploadé), créer une URL temporaire
    if (document.file) {
      const url = URL.createObjectURL(document.file);
      window.open(url, '_blank');
      // Nettoyer l'URL après un délai pour libérer la mémoire
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (document.url && !document.url.startsWith('#')) {
      // Si le document a une URL valide
      window.open(document.url, '_blank');
    } else {
      // Pour les documents existants sans fichier ni URL valide
      console.log('Document sans fichier ou URL valide:', document.nom);
      alert(`Impossible d'ouvrir le document: ${document.nom}\n\nCe document nécessite une connexion au serveur pour être visualisé.`);
    }
  };

  // Fonction pour obtenir tous les documents (existants + uploadés)
  const getAllDocuments = () => {
    // Les documents proviennent de la demande d'inscription originale
    const existingDocs = eleve.originalDocuments || [];
    const allDocs = [...existingDocs, ...uploadedDocuments];
    return allDocs;
  };

  const handleDownloadDocument = (document: any) => {
    // Si le document a un fichier (document uploadé), on peut le télécharger directement
    if (document.file) {
      const url = URL.createObjectURL(document.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.nom;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Pour les documents existants, simulation du téléchargement
      console.log('Téléchargement du document existant:', document.nom);
      // En réalité, ici vous devriez faire un appel API pour télécharger le document
      alert(`Téléchargement du document: ${document.nom}\n\nEn production, ceci ferait un appel API pour récupérer le fichier depuis le serveur.`);
    }
  };

  const handleReplaceDocument = (document: any) => {
    setReplacingDocumentId(document.id);
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleDeleteDocument = (document: any) => {
    console.log('Suppression du document:', document.nom);
  };

  const handleUploadNewDocument = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newDocument = {
            id: replacingDocumentId || (Date.now() + Math.random()),
            nom: file.name,
            taille: formatFileSize(file.size),
            dateUpload: new Date().toISOString(),
            type: file.type,
            url: e.target?.result as string,
            file: file,
            isReplacement: !!replacingDocumentId
          };
          
          if (replacingDocumentId) {
            setUploadedDocuments(prev => 
              prev.map(doc => doc.id === replacingDocumentId ? newDocument : doc)
            );
            setReplacingDocumentId(null);
          } else {
            setUploadedDocuments(prev => [...prev, newDocument]);
          }
        };
        reader.readAsDataURL(file);
      });
      
      setTimeout(() => {
        setUploading(false);
      }, 1000);
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  // Fonction pour ouvrir le sheet de complétion
  const handleOpenCompletionSheet = () => {
    setCompletionSheetOpen(true);
  };

  // Fonction pour fermer le sheet de complétion
  const handleCloseCompletionSheet = () => {
    setCompletionSheetOpen(false);
  };

  // Fonction appelée quand la complétion réussit
  const handleCompletionSuccess = () => {
    console.log('Dossier complété avec succès - l\'élève a été transféré vers le module de validation');
    setCompletionSheetOpen(false);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400, md: 500 },
          maxWidth: '100vw',
          boxShadow: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" className="font-display">
            Détails de l'élève
          </Typography>
          <IconButton onClick={onClose} size="small">
            <XMarkIcon className="w-5 h-5" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Contenu principal */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {/* Informations de base */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                <Typography variant="h6" fontWeight="bold" className="font-display">
                  {eleve.firstName} {eleve.lastName}
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2" className="font-primary">{eleve.email}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2" className="font-primary">{eleve.phone}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <MapPinIcon className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                  <Typography variant="body2" className="font-primary">{eleve.address}</Typography>
                </Box>
                
                {(eleve as any).birthDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                    <Typography variant="body2" className="font-primary">
                      Né(e) le {new Date((eleve as any).birthDate).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                )}
                
                {(eleve as any).lieuNaissance && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                    <Typography variant="body2" className="font-primary">
                      Lieu de naissance: {(eleve as any).lieuNaissance}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2" className="font-primary">
                    Nationalité: {(eleve as any).nationality || 'Non spécifiée'}
                    {(eleve as any).nationaliteEtrangere && (eleve as any).nationality === 'Étrangère' && 
                      ` (${(eleve as any).nationaliteEtrangere})`
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Informations de l'auto-école */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
                <Typography variant="h6" fontWeight="bold" className="font-display">
                  Auto-École
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                    Nom de l'auto-école
                  </Typography>
                  <Typography variant="body1" className="font-primary">
                    {eleve.autoEcole.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                    Date de validation
                  </Typography>
                  <Typography variant="body1" className="font-primary">
                    {new Date(eleve.validatedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                    Statut
                  </Typography>
                  <Chip
                    label={getStatutLabel(eleve.status)}
                    color={getStatutColor(eleve.status) as any}
                    size="small"
                  />
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                    ID de la demande
                  </Typography>
                  <Typography variant="body1" className="font-primary">
                    {eleve.demandeId}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <Typography variant="h6" fontWeight="bold" className="font-display">
                    Documents ({getAllDocuments().length})
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CloudArrowUpIcon className="w-4 h-4" />}
                  onClick={handleUploadNewDocument}
                  disabled={uploading}
                  sx={{ 
                    backgroundColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  Ajouter un document
                </Button>
              </Box>

              {uploading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" className="font-primary">
                    Upload en cours...
                  </Typography>
                </Box>
              )}

              {/* Input file caché */}
              <input
                type="file"
                ref={setFileInputRef}
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                style={{ display: 'none' }}
              />

              {/* Documents existants + uploadés */}
              {getAllDocuments().length > 0 ? (
                <Stack spacing={2}>
                  {/* Documents existants (non remplacés) */}
                  {(eleve.originalDocuments || [])
                    .filter((doc: any) => !uploadedDocuments.some(uploaded => uploaded.id === doc.id))
                    .map((doc: any) => (
                    <Box
                      key={doc.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium" gutterBottom className="font-primary">
                            {doc.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" className="font-primary">
                            Taille: {doc.taille}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="font-primary">
                            Uploadé le {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                          <Tooltip title="Voir le document">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocument(doc)}
                              color="primary"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Télécharger">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(doc)}
                              color="secondary"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remplacer">
                            <IconButton
                              size="small"
                              onClick={() => handleReplaceDocument(doc)}
                              color="warning"
                            >
                              <CloudArrowUpIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteDocument(doc)}
                              color="error"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  {/* Documents uploadés/remplacés */}
                  {uploadedDocuments.map((doc) => (
                    <Box
                      key={doc.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="medium" gutterBottom className="font-primary">
                            {doc.nom}
                            {doc.isReplacement && (
                              <Chip 
                                label="Remplacé" 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" className="font-primary">
                            Taille: {doc.taille}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="font-primary">
                            {doc.isReplacement ? 'Remplacé' : 'Uploadé'} le {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                          <Tooltip title="Voir le document">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocument(doc)}
                              color="primary"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Télécharger">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(doc)}
                              color="secondary"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remplacer">
                            <IconButton
                              size="small"
                              onClick={() => handleReplaceDocument(doc)}
                              color="warning"
                            >
                              <CloudArrowUpIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setUploadedDocuments(prev => prev.filter(d => d.id !== doc.id));
                                handleDeleteDocument(doc);
                              }}
                              color="error"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <Typography variant="h6" color="text.secondary" gutterBottom className="font-display">
                    Aucun document uploadé
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} className="font-primary">
                    Cliquez sur le bouton ci-dessous pour ajouter des documents
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CloudArrowUpIcon className="w-5 h-5" />}
                    onClick={handleUploadNewDocument}
                    disabled={uploading}
                    sx={{ 
                      backgroundColor: 'primary.main',
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'primary.dark'
                      }
                    }}
                  >
                    Ajouter le premier document
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Actions */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose} className="font-primary">
              Fermer
            </Button>
            <Button 
              variant="contained" 
              color="success"
              onClick={handleOpenCompletionSheet}
              sx={{ 
                minWidth: 140
              }}
              className="font-primary"
            >
              Compléter le dossier
            </Button>
          </Stack>
        </Box>
      </Box>


      {/* Sheet de complétion du dossier */}
      <DossierCompletionSheet
        open={completionSheetOpen}
        onClose={handleCloseCompletionSheet}
        eleve={eleve}
        onCompletionSuccess={handleCompletionSuccess}
      />
    </Drawer>
  );
};

export default EleveDetailsSheet;
