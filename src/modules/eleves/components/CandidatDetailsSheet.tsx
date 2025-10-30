import React, { useEffect, useMemo, useState } from 'react';
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
import { DemandeInscription } from '../types/inscription';
import ValidationService from '../services/validationService';

interface CandidatDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  candidat: DemandeInscription | null;
  onValidationSuccess?: () => void; // Callback pour notifier la validation
}

const CandidatDetailsSheet: React.FC<CandidatDetailsSheetProps> = ({
  open,
  onClose,
  candidat,
  onValidationSuccess
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [replacingDocumentId, setReplacingDocumentId] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const storageKey = useMemo(() => `candidat_docs_${candidat?.id || 'unknown'}`, [candidat?.id]);

  // Déplacé en haut et déclaré en function pour être disponible avant usage (hoisted)
  function getAllDocuments() {
    const existingDocs = candidat?.documents.filter(doc => 
      !uploadedDocuments.some(uploaded => uploaded.id === doc.id)
    ) || [];
    const allDocs = [...existingDocs, ...uploadedDocuments];
    console.log('Documents existants:', existingDocs);
    console.log('Documents uploadés:', uploadedDocuments);
    console.log('Tous les documents:', allDocs);
    return allDocs;
  }

  // Déterminer les pièces requises selon la nationalité
  const isGabonais = useMemo(() => {
    const nat = (candidat?.eleve?.nationality || '').toLowerCase();
    return nat.includes('gabon');
  }, [candidat]);

  const requiredDocs = useMemo(() => {
    return isGabonais
      ? ["pièce d'identité", 'acte de naissance']
      : ['carte de séjour', 'passeport', 'certificat de résidence', 'acte de naissance'];
  }, [isGabonais]);

  const normalize = (v: any) => (v || '').toString().toLowerCase();

  const hasDocument = (label: string) => {
    const allDocsLocal = getAllDocuments();
    return allDocsLocal.some((d: any) => {
      const byName = normalize(d.nom).includes(label);
      const byType = normalize(d.type_document?.libelle).includes(label) || normalize(d.type).includes(label) || normalize(d.selectedDocType).includes(label);
      return byName || byType;
    });
  };

  const missingDocs = useMemo(() => requiredDocs.filter(l => !hasDocument(l)), [requiredDocs, uploadedDocuments, candidat]);

  // Persistance: charger depuis localStorage au montage/au changement de candidat
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUploadedDocuments(parsed);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persistance: sauvegarder à chaque changement
  useEffect(() => {
    try {
      // Retirer les objets File avant persistance
      const serializable = uploadedDocuments.map((d: any) => {
        const { file, ...rest } = d || {};
        return rest;
      });
      localStorage.setItem(storageKey, JSON.stringify(serializable));
    } catch {}
  }, [uploadedDocuments, storageKey]);

  if (!candidat) return null;

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'validee': return 'success';
      case 'rejetee': return 'error';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'validee': return 'Validée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  };


  // (supprimé - redéfini plus haut en function hoisted)

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
    // Marquer le document à remplacer et ouvrir le sélecteur
    setReplacingDocumentId(document.id);
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleDeleteDocument = (document: any) => {
    // Simulation de la suppression
    console.log('Suppression du document:', document.nom);
    // Ici vous pouvez implémenter la logique de suppression
  };

  const handleUploadNewDocument = () => {
    if (!selectedDocType) {
      alert('Veuillez sélectionner le type de document à uploader.');
      return;
    }
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      
      // Traitement de chaque fichier
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
            isReplacement: !!replacingDocumentId,
            selectedDocType,
            type_document: { libelle: selectedDocType },
            status: 'téléchargé'
          };
          
          if (replacingDocumentId) {
            // Remplacer le document existant
            setUploadedDocuments(prev => 
              prev.map(doc => doc.id === replacingDocumentId ? newDocument : doc)
            );
            setReplacingDocumentId(null);
          } else {
            // Ajouter un nouveau document
            setUploadedDocuments(prev => {
              console.log('Ajout du document:', newDocument);
              console.log('Documents actuels:', prev);
              return [...prev, newDocument];
            });
          }
        };
        reader.readAsDataURL(file);
      });
      
      setTimeout(() => {
        setUploading(false);
      }, 1000);
    }
    
    // Reset du file input
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


  // Fonction pour valider la demande et la transférer
  const handleValidation = async () => {
    if (!candidat) return;

    try {
      setValidating(true);

      // Vérifier les pièces requises avant validation
      if (missingDocs.length > 0) {
        alert(
          `Documents manquants pour la nationalité ${isGabonais ? 'Gabonais' : 'Étrangère'}:\n- ${missingDocs.join('\n- ')}`
        );
        setValidating(false);
        return;
      }
      
      // Valider la demande et la transférer vers les élèves validés
      const eleveValide = await ValidationService.validerDemande(candidat);
      
      console.log('Demande validée avec succès:', eleveValide);
      
      // Notifier le parent de la validation réussie
      if (onValidationSuccess) {
        onValidationSuccess();
      }
      
      // Fermer le sheet
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    } finally {
      setValidating(false);
    }
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
          <Typography variant="h5" component="h2" fontWeight="bold">
            Détails du candidat
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
                <Typography variant="h6" fontWeight="bold">
                  {candidat.eleve.firstName} {candidat.eleve.lastName}
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2">{candidat.eleve.email}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2">{candidat.eleve.phone}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <MapPinIcon className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                  <Typography variant="body2">{candidat.eleve.address}</Typography>
                </Box>
                
                {candidat.eleve.birthDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                    <Typography variant="body2">
                      Né(e) le {new Date(candidat.eleve.birthDate).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                )}
                
                {(candidat.eleve as any).lieuNaissance && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                    <Typography variant="body2">
                      Lieu de naissance: {(candidat.eleve as any).lieuNaissance}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-500" />
                  <Typography variant="body2">
                    Nationalité: {candidat.eleve.nationality}
                    {(candidat.eleve as any).nationaliteEtrangere && candidat.eleve.nationality === 'Étrangère' && 
                      ` (${(candidat.eleve as any).nationaliteEtrangere})`
                    }
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Informations de la demande */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
                <Typography variant="h6" fontWeight="bold">
                  Demande d'inscription
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Numéro de demande
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {candidat.numero}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Auto-École
                  </Typography>
                  <Typography variant="body1">
                    {candidat.autoEcole.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Date de demande
                  </Typography>
                  <Typography variant="body1">
                    {new Date(candidat.dateDemande).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Statut
                  </Typography>
                  <Chip
                    label={getStatutLabel(candidat.statut)}
                    color={getStatutColor(candidat.statut) as any}
                    size="small"
                  />
                </Box>
                
                {candidat.commentaires && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Commentaires
                    </Typography>
                    <Typography variant="body1">
                      {candidat.commentaires}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardContent>
              {/* Choix du type de document à uploader */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" color="primary">
                  Sélectionner le type de document à uploader
                </Typography>
                <Box>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #e0e0e0' }}
                  >
                    <option value="">-- Choisir --</option>
                    {requiredDocs.map((doc) => {
                      const present = hasDocument(doc);
                      return (
                        <option key={doc} value={doc}>
                          {doc}{present ? ' - Téléchargé' : ''}
                        </option>
                      );
                    })}
                  </select>
                </Box>
              </Box>
            {/* Exigences documentaires selon nationalité */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Pièces requises ({isGabonais ? 'Candidat Gabonais' : 'Candidat Étranger'})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {requiredDocs.map((doc) => {
                  const present = hasDocument(doc);
                  return (
                    <Chip
                      key={doc}
                      label={`${doc}${present ? '' : ' (manquant)'}`}
                      color={present ? 'success' : 'warning'}
                      size="small"
                      variant={present ? 'filled' : 'outlined'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  );
                })}
              </Stack>
            </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                  <Typography variant="h6" fontWeight="bold">
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
                  <Typography variant="caption" color="text.secondary">
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
                  {candidat.documents
                    .filter(doc => !uploadedDocuments.some(uploaded => uploaded.id === doc.id))
                    .map((doc) => (
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
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {doc.nom.length > 6 ? `${doc.nom.substring(0, 12)}...` : doc.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taille: {doc.taille}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
                          <Typography variant="body1" fontWeight="medium" gutterBottom>
                            {doc.nom.length > 6 ? `${doc.nom.substring(0, 6)}...` : doc.nom}
                            {doc.isReplacement && (
                              <Chip 
                                label="Remplacé" 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                            {doc.selectedDocType && (
                              <Chip 
                                label={doc.selectedDocType}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.7rem', textTransform: 'capitalize' }}
                              />
                            )}
                            {doc.status === 'téléchargé' && (
                              <Chip 
                                label="Téléchargé"
                                size="small"
                                color="success"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taille: {doc.taille}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun document uploadé
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
            <Button variant="outlined" onClick={onClose} disabled={validating}>
              Fermer
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleValidation}
              disabled={validating || missingDocs.length > 0}
              sx={{ 
                minWidth: 120,
                '&:disabled': {
                  opacity: 0.6
                }
              }}
            >
              {validating ? 'Validation...' : 'Valider'}
            </Button>
          </Stack>
        </Box>
      </Box>

    </Drawer>
  );
};

export default CandidatDetailsSheet;
