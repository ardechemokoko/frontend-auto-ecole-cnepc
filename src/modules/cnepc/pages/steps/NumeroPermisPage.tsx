import React, { useEffect } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { useCreateDossier } from '../../contexts/CreateDossierContext';
import { NumeroPermisStep } from '../../forms/steps';

interface NumeroPermisPageProps {
  onNext: () => void;
  onBack: () => void;
}

const NumeroPermisPage: React.FC<NumeroPermisPageProps> = ({ onNext, onBack }) => {
  const {
    numeroPermisParts,
    permisFormat,
    isFicheEnregistre,
    availableCategories,
    setNumeroPermisParts,
    setPermisFormat,
    error,
    setError,
    verifyingPermisPrincipal,
    permisPrincipalVerified,
    verificationErrorPrincipal,
    candidatNonTrouvePrincipal,
    personneData,
    candidatData,
    handleVerifyPermisPrincipal,
  } = useCreateDossier();

  // Log pour déboguer les changements de catégorie
  useEffect(() => {
    console.log('🔍 [NumeroPermisPage] État actuel:', {
      numeroPermisParts,
      categorie: numeroPermisParts.categorie,
      availableCategories,
      permisPrincipalVerified,
    });
  }, [numeroPermisParts.categorie, availableCategories, permisPrincipalVerified]);

  const handleNext = () => {
    // Si plusieurs catégories sont disponibles et que le permis est vérifié, s'assurer qu'une catégorie est sélectionnée
    if (availableCategories.length > 1 && permisPrincipalVerified && !numeroPermisParts.categorie) {
      setError('Veuillez sélectionner une catégorie de permis avant de continuer');
      return;
    }
    
    // Si le permis est vérifié mais qu'aucune catégorie n'est définie, afficher une erreur
    if (permisPrincipalVerified && !numeroPermisParts.categorie) {
      setError('Veuillez sélectionner ou saisir une catégorie de permis avant de continuer');
      return;
    }
    
    console.log('✅ [NumeroPermisPage] Navigation vers l\'étape suivante:', {
      numeroPermisParts: JSON.stringify(numeroPermisParts),
      categorie: numeroPermisParts.categorie,
      categorieType: typeof numeroPermisParts.categorie,
      availableCategories,
      permisPrincipalVerified,
    });
    
    // Vérifier une dernière fois que la catégorie est bien présente
    if (permisPrincipalVerified && !numeroPermisParts.categorie) {
      console.error('❌ [NumeroPermisPage] ERREUR: La catégorie est toujours vide avant la navigation!');
      setError('Erreur: La catégorie de permis n\'a pas été sélectionnée. Veuillez réessayer.');
      return;
    }
    
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Étape 2 : Numéro de permis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Saisissez le numéro de permis pour ce dossier
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <NumeroPermisStep
          numeroPermisParts={numeroPermisParts}
          isFicheEnregistre={isFicheEnregistre}
          loading={false}
          format={permisFormat}
          availableCategories={availableCategories}
          onNumeroPermisPartsChange={setNumeroPermisParts}
          onFormatChange={setPermisFormat}
          verifyingPermis={verifyingPermisPrincipal}
          permisVerified={permisPrincipalVerified}
          verificationError={verificationErrorPrincipal}
          candidatNonTrouve={candidatNonTrouvePrincipal}
          personneData={personneData}
          candidatData={candidatData}
          onVerifyPermis={handleVerifyPermisPrincipal}
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
          disabled={verifyingPermisPrincipal}
        >
          Suivant
        </Button>
      </Box>
    </Box>
  );
};

export default NumeroPermisPage;

