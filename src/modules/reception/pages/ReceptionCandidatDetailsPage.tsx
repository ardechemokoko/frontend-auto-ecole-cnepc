import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  CircularProgress,
  Container,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert
} from '@mui/material';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../../shared/constants';
import { useReceptionCandidatDetails } from '../hooks/useReceptionCandidatDetails';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { handleViewDocument, handleDownloadDocument } from '../utils/documentHandlers';
import { circuitSuiviService } from '../services/circuit-suivi.service';
import CandidatInfoCard from '../components/CandidatInfoCard';
import AutoEcoleInfoCard from '../components/AutoEcoleInfoCard';
import CircuitEtapesCard from '../components/CircuitEtapesCard';
import DocumentsCard from '../components/DocumentsCard';

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
    isDocumentValidatedForPiece
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
            Réception des dossiersss
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
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Chargement des données...</Typography>
          </Box>
        ) : (
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
                <CandidatInfoCard candidatData={candidatData} personne={personne} />

                {/* Informations de l'auto-école - Masquer si pas de données */}
                {(() => {
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
                    <AutoEcoleInfoCard 
                      autoEcole={autoEcole}
                      formation={formation}
                      dossier={dossier}
                      dossierId={id}
                    />
                  );
                })()}

                {/* Documents      */}
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
                />
           
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
              />
            </Box>
          </Box>
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
