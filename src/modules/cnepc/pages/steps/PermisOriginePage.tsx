import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useCreateDossier } from '../../contexts/CreateDossierContext';
import { PermisOrigineStep } from '../../forms/steps';

interface PermisOriginePageProps {
  onNext: () => void;
  onBack: () => void;
}

const PermisOriginePage: React.FC<PermisOriginePageProps> = ({ onNext, onBack }) => {
  const {
    numeroOriginePermisParts,
    permisOrigineFormat,
    permisData,
    setNumeroOriginePermisParts,
    setPermisOrigineFormat,
    setPermisData,
    error,
    setError,
    verifyingPermisOrigine,
    permisOrigineVerified,
    verificationErrorOrigine,
    candidatNonTrouveOrigine,
    handleVerifyPermisOrigine,
  } = useCreateDossier();

  const handleNext = () => {
    if (!permisOrigineVerified) {
      setError('Veuillez vérifier le permis d\'origine avant de continuer');
      return;
    }
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Permis d'origine
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Saisissez les informations du permis d'origine (catégorie C, D ou E)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <PermisOrigineStep
          numeroOriginePermisParts={numeroOriginePermisParts}
          loading={false}
          permisOrigineFormat={permisOrigineFormat}
          lieuOrigine={permisData.lieu_de_dobtention_du_permis}
          verifyingPermis={verifyingPermisOrigine}
          permisVerified={permisOrigineVerified}
          verificationError={verificationErrorOrigine}
          candidatNonTrouve={candidatNonTrouveOrigine}
          onNumeroOriginePermisPartsChange={setNumeroOriginePermisParts}
          onPermisOrigineFormatChange={setPermisOrigineFormat}
          onLieuOrigineChange={(lieu) => setPermisData(prev => ({ ...prev, lieu_de_dobtention_du_permis: lieu }))}
          onVerifyPermis={handleVerifyPermisOrigine}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
        >
          Retour
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={handleNext}
          disabled={!permisOrigineVerified || verifyingPermisOrigine}
        >
          Suivant
        </Button>
      </Box>
    </Box>
  );
};

export default PermisOriginePage;

