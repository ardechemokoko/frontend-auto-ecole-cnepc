import React, { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Container,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Skeleton,
  Fade
} from '@mui/material';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../../shared/constants';
import { useReceptionCandidatDetails } from '../hooks/useReceptionCandidatDetails';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { handleViewDocument, handleDownloadDocument } from '../utils/documentHandlers';
import { circuitSuiviService } from '../services/circuit-suivi.service';

// Lazy loading des composants de cartes
const CandidatInfoCard = lazy(() => import('../components/CandidatInfoCard'));
const AutoEcoleInfoCard = lazy(() => import('../components/AutoEcoleInfoCard'));
const CircuitEtapesCard = lazy(() => import('../components/CircuitEtapesCard'));
const DocumentsCard = lazy(() => import('../components/DocumentsCard'));

// Composants Skeleton pour le chargement transparent
const CandidatInfoCardSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 1 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="40%" height={24} />
        </Box>
        <Skeleton variant="text" width="50%" height={20} />
      </CardContent>
    </Card>
  </Fade>
);

const AutoEcoleInfoCardSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={24} />
      </CardContent>
    </Card>
  </Fade>
);

const DocumentsCardSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </CardContent>
    </Card>
  </Fade>
);

const CircuitEtapesCardSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" height={8} sx={{ mb: 3, borderRadius: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </CardContent>
    </Card>
  </Fade>
);

const ReceptionCandidatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const {
    loading,
    loadingDocuments,
    dossierComplet,
    dossier,
    epreuvesStatus,
    loadingEpreuves,
    circuit,
    loadingCircuit,
    typeDocuments,
    loadingTypeDocuments,
    documentsFromApi,
    chargerDocuments,
    formatFileSize,
    getDocumentsByType,
    getDocumentsForPiece,
    isDocumentValidated,
    isDocumentValidatedForPiece,
    pieceJustificationTypeMap
  } = useReceptionCandidatDetails(id);

  const { uploading, fileInputRef, handleUploadNewDocument, handleFileSelect: handleFileSelectUpload } = useDocumentUpload({
    dossierId: id,
    formatFileSize,
    onUploadSuccess: async () => {
      await chargerDocuments();
      setSnackbar({
        open: true,
        message: 'Document uploadé avec succès',
        severity: 'success'
      });
    },
    onError: (message) => {
      setSnackbar({
        open: true,
        message,
        severity: 'error'
      });
    }
  });

  // Utiliser les données complètes si disponibles, sinon utiliser les données du dossier
  const candidatData = dossierComplet?.candidat || dossier?.details?.candidat_complet || dossier?.details?.dossier?.candidat;
  const personne = candidatData?.personne || {};
  const formation = dossierComplet?.formation || dossier?.details?.formation_complete || dossier?.details?.dossier?.formation;
  const autoEcole = dossierComplet?.auto_ecole || dossier?.details?.auto_ecole_complete || {};

  const handleUpdateDocument = async (documentId: string, data: { valide: boolean; commentaires?: string }) => {
    try {
      await circuitSuiviService.updateDocument(documentId, data);
      
      // Rafraîchir les documents après la mise à jour
      await chargerDocuments();
      
      setSnackbar({
        open: true,
        message: data.valide ? 'Document validé avec succès' : 'Document invalidé avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du document:', error);
      
      let errorMessage = 'Erreur lors de la mise à jour du document';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };


  if (!dossier && !loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Dossier non trouvé
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowLeftIcon className="w-5 h-5" />}
            onClick={() => navigate(ROUTES.RECEPTION || '/reception')}
            sx={{ mt: 2 }}
          >
            Retour à la liste
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
      <Container maxWidth={false} sx={{ px: { xs: 0, sm: 2, md: 3 } }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate(ROUTES.RECEPTION || '/reception')}
            sx={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            Réception des dossiers
          </Link>
          <Typography color="text.primary">
            Détails du candidat
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(ROUTES.RECEPTION || '/reception')}
              sx={{ mr: 1 }}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight="bold" className="font-display">
              Détails du candidat
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Contenu principal */}
        {loading ? (
          <Fade in={true} timeout={300}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 3, 
                alignItems: 'flex-start' 
              }}
            >
              {/* Colonne gauche - Skeletons */}
              <Box 
                sx={{ 
                  flex: { xs: '1 1 100%', lg: '1 1 40%' }, 
                  minWidth: 0,
                  width: { xs: '100%', lg: 'auto' }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <CandidatInfoCardSkeleton />
                  <AutoEcoleInfoCardSkeleton />
                  <DocumentsCardSkeleton />
                </Box>
              </Box>
              
              {/* Colonne droite - Skeleton */}
              <Box 
                sx={{ 
                  flex: { xs: '1 1 100%', lg: '1 1 60%' }, 
                  minWidth: 0,
                  width: { xs: '100%', lg: 'auto' }
                }}
              >
                <CircuitEtapesCardSkeleton />
              </Box>
            </Box>
          </Fade>
        ) : (
          <Fade in={true} timeout={500}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 3, 
                alignItems: 'flex-start' 
              }}
            >
            {/* Colonne gauche - Cartes d'informations */}
            <Box 
              sx={{ 
                flex: { xs: '1 1 100%', lg: '1 1 40%' }, 
                minWidth: 0,
                width: { xs: '100%', lg: 'auto' }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Informations de base */}
                <Suspense fallback={<CandidatInfoCardSkeleton />}>
                  <CandidatInfoCard candidatData={candidatData} personne={personne} />
                </Suspense>

                {/* Informations de l'auto-école - Masquer si pas de données ou si le circuit n'est pas NOUVEAUPERMIS */}
                {(() => {
                  // Vérifier si le circuit est de type NOUVEAUPERMIS
                  const isNouveauPermis = circuit?.nom_entite === 'NOUVEAUPERMIS';
                  
                  // Si le circuit n'est pas NOUVEAUPERMIS, ne pas afficher la carte
                  if (!isNouveauPermis) {
                    return null;
                  }
                  
                  // Vérifier si on a des données valides pour l'auto-école
                  const hasAutoEcole = autoEcole && (
                    autoEcole.nom_auto_ecole || 
                    autoEcole.nom || 
                    (Object.keys(autoEcole).length > 0 && autoEcole.id !== undefined)
                  );
                  
                  // Vérifier si on a des données valides pour la formation
                  const hasFormation = formation && (
                    formation.type_permis || 
                    formation.nom || 
                    (Object.keys(formation).length > 0 && formation.id !== undefined)
                  );
                  
                  // Afficher la carte seulement si on a au moins l'auto-école ou la formation avec des données réelles
                  if (!hasAutoEcole && !hasFormation) {
                    return null;
                  }
                  
                  return (
                    <Suspense fallback={<AutoEcoleInfoCardSkeleton />}>
                      <AutoEcoleInfoCard 
                        autoEcole={autoEcole}
                        formation={formation}
                        dossier={dossier}
                        dossierId={id}
                      />
                    </Suspense>
                  );
                })()}

                {/* Documents */}
                <Suspense fallback={<DocumentsCardSkeleton />}>
                  <DocumentsCard
                    documentsFromApi={documentsFromApi}
                    loadingDocuments={loadingDocuments}
                    uploading={uploading}
                    dossierId={id}
                    fileInputRef={fileInputRef}
                    onUploadClick={handleUploadNewDocument}
                    onFileSelect={handleFileSelectUpload}
                    onViewDocument={handleViewDocument}
                    onDownloadDocument={handleDownloadDocument}
                    onUpdateDocument={handleUpdateDocument}
                    formatFileSize={formatFileSize}
                    circuit={circuit}
                    typeDocuments={typeDocuments}
                    pieceJustificationTypeMap={pieceJustificationTypeMap}
                  />
                </Suspense>
           
              </Box>
            </Box>

            {/* Colonne droite - Circuit et Étapes */}
            <Box 
              sx={{ 
                flex: { xs: '1 1 100%', lg: '1 1 60%' }, 
                minWidth: 0,
                width: { xs: '100%', lg: 'auto' }
              }}
            >
              <Suspense fallback={<CircuitEtapesCardSkeleton />}>
                <CircuitEtapesCard
                  circuit={circuit}
                  loadingCircuit={loadingCircuit}
                  loadingTypeDocuments={loadingTypeDocuments}
                  typeDocuments={typeDocuments}
                  documentsFromApi={documentsFromApi}
                  getDocumentsByType={getDocumentsByType}
                  getDocumentsForPiece={getDocumentsForPiece}
                  isDocumentValidated={isDocumentValidated}
                  isDocumentValidatedForPiece={isDocumentValidatedForPiece}
                  dossierId={id}
                  dossierComplet={dossierComplet}
                  onDocumentUploaded={chargerDocuments}
                  uploading={uploading}
                  onUpdateDocument={handleUpdateDocument}
                  epreuvesStatus={epreuvesStatus || undefined}
                  loadingEpreuves={loadingEpreuves}
                  onSendToCNEDDT={() => {
                    // Optionnel: recharger les données après l'envoi
                    if (chargerDocuments) {
                      chargerDocuments();
                    }
                  }}
                  pieceJustificationTypeMap={pieceJustificationTypeMap}
                />
              </Suspense>
            </Box>
          </Box>
          </Fade>
        )}
      </Container>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceptionCandidatDetailsPage;
