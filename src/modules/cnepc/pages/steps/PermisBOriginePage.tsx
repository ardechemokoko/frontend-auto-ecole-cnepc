import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useCreateDossier } from '../../contexts/CreateDossierContext';
import { PermisBOrigineStep } from '../../forms/steps';

interface PermisBOriginePageProps {
  onNext: () => void;
  onBack: () => void;
}

const PermisBOriginePage: React.FC<PermisBOriginePageProps> = ({ onNext, onBack }) => {
  const {
    numeroBOriginePermisParts,
    permisBOrigineFormat,
    permisBOrigineData,
    setNumeroBOriginePermisParts,
    setPermisBOrigineFormat,
    setPermisBOrigineData,
    error,
    setError,
    verifyingPermis,
    permisVerified,
    verificationError,
    candidatNonTrouve,
    handleVerifyPermis,
  } = useCreateDossier();

  const handleNext = () => {
    if (!permisVerified) {
      setError('Veuillez vérifier le permis B d\'origine avant de continuer');
      return;
    }
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Permis B d'origine
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Saisissez les informations du permis B d'origine (requis pour le permis C)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <PermisBOrigineStep
          numeroBOriginePermisParts={numeroBOriginePermisParts}
          permisBOrigineFormat={permisBOrigineFormat}
          permisBOrigineData={permisBOrigineData}
          loading={false}
          verifyingPermis={verifyingPermis}
          permisVerified={permisVerified}
          verificationError={verificationError}
          candidatNonTrouve={candidatNonTrouve}
          onNumeroBOriginePermisPartsChange={setNumeroBOriginePermisParts}
          onPermisBOrigineFormatChange={setPermisBOrigineFormat}
          onPermisBOrigineDataChange={setPermisBOrigineData}
          onVerifyPermis={handleVerifyPermis}
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
          disabled={!permisVerified || verifyingPermis}
        >
          Suivant
        </Button>
      </Box>
    </Box>
  );
};

export default PermisBOriginePage;

