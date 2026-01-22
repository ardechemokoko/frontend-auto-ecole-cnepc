import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useCreateDossier } from '../../contexts/CreateDossierContext';
import { PersonneFormStep } from '../../forms/steps';
import { authService } from '../../../auth/services';
import { validatePersonne } from '../../forms/validation';
import { getFieldLabel } from '../../forms/utils';

interface PersonneFormPageProps {
  onNext: () => void;
  onBack: () => void;
}

const PersonneFormPage: React.FC<PersonneFormPageProps> = ({ onNext, onBack }) => {
  const {
    personneData,
    captchaId,
    captchaCode,
    setPersonneData,
    setCaptchaId,
    setCaptchaCode,
    setPersonneId,
    setLoading,
    setError,
    error,
    loading,
  } = useCreateDossier();

  const handleRegister = async () => {
    setError(null);
    
    if (!validatePersonne({ personneData, setError })) {
      return;
    }
    
    if (!captchaId || !captchaCode) {
      setError('Veuillez remplir le code captcha');
      return;
    }

    setLoading(true);
    try {
      const registerPayload = {
        email: personneData.email,
        password: personneData.password,
        password_confirmation: personneData.password_confirmation,
        nom: personneData.nom,
        prenom: personneData.prenom,
        contact: personneData.contact,
        telephone: personneData.telephone || personneData.contact,
        adresse: personneData.adresse || '',
        role: 'candidat',
        captcha_id: captchaId,
        captcha_code: captchaCode,
      };

      const registerResponse = await authService.register(registerPayload);
      
      if (registerResponse.user?.personne?.id) {
        setPersonneId(registerResponse.user.personne.id);
        onNext();
      } else {
        setError('Erreur: Impossible de récupérer l\'ID de la personne');
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages: string[] = [];
        
        Object.entries(errors).forEach(([field, messages]: [string, any]) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg: string) => errorMessages.push(`${getFieldLabel(field)}: ${msg}`));
          } else {
            errorMessages.push(`${getFieldLabel(field)}: ${messages}`);
          }
        });
        
        if (errorMessages.length > 0) {
          setError(errorMessages.join(', '));
        } else {
          setError('Erreur lors de l\'enregistrement. Veuillez vérifier vos informations.');
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Informations personnelles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Remplissez vos informations personnelles pour créer votre compte
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <PersonneFormStep
          personneData={personneData}
          loading={loading}
          captchaId={captchaId}
          captchaCode={captchaCode}
          onPersonneDataChange={setPersonneData}
          onCaptchaIdChange={setCaptchaId}
          onCaptchaCodeChange={setCaptchaCode}
          onRegister={handleRegister}
          onBack={onBack}
          error={error}
        />
      </Box>
    </Box>
  );
};

export default PersonneFormPage;

