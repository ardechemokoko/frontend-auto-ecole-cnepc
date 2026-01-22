import React from 'react';
import { Grid, Typography, TextField, Divider, Button, Box } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { PersonneData } from '../types';
import { CaptchaInput } from '../../../auth/components/CaptchaInput';

interface PersonneFormStepProps {
  personneData: PersonneData;
  loading: boolean;
  captchaId: string;
  captchaCode: string;
  onPersonneDataChange: (data: PersonneData) => void;
  onCaptchaIdChange: (captchaId: string) => void;
  onCaptchaCodeChange: (captchaCode: string) => void;
  onRegister: () => Promise<void>;
  onBack?: () => void;
  error?: string | null;
}

export const PersonneFormStep: React.FC<PersonneFormStepProps> = ({
  personneData,
  loading,
  captchaId,
  captchaCode,
  onPersonneDataChange,
  onCaptchaIdChange,
  onCaptchaCodeChange,
  onRegister,
  onBack,
  error,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Informations d'identité
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Nom"
          value={personneData.nom}
          onChange={(e) => onPersonneDataChange({ ...personneData, nom: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Prénom"
          value={personneData.prenom}
          onChange={(e) => onPersonneDataChange({ ...personneData, prenom: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Coordonnées
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Email"
          type="email"
          value={personneData.email}
          onChange={(e) => onPersonneDataChange({ ...personneData, email: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Contact"
          value={personneData.contact}
          onChange={(e) => onPersonneDataChange({ ...personneData, contact: e.target.value })}
          fullWidth
          required
          disabled={loading}
          placeholder="Ex: 0612345678"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Téléphone"
          value={personneData.telephone}
          onChange={(e) => onPersonneDataChange({ ...personneData, telephone: e.target.value })}
          fullWidth
          disabled={loading}
          placeholder="Ex: 0612345678"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Adresse"
          value={personneData.adresse}
          onChange={(e) => onPersonneDataChange({ ...personneData, adresse: e.target.value })}
          fullWidth
          multiline
          rows={2}
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Sécurité
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Mot de passe"
          type="password"
          value={personneData.password}
          onChange={(e) => onPersonneDataChange({ ...personneData, password: e.target.value })}
          fullWidth
          required
          disabled={loading}
          helperText="Minimum 8 caractères"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          value={personneData.password_confirmation}
          onChange={(e) => onPersonneDataChange({ ...personneData, password_confirmation: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Vérification
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <CaptchaInput
          value={captchaCode}
          onChange={(value) => onCaptchaCodeChange(value)}
          onCaptchaIdChange={onCaptchaIdChange}
        />
      </Grid>
      {error && (
        <Grid item xs={12}>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        </Grid>
      )}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          {onBack && (
            <Button
              startIcon={<ArrowBack />}
              onClick={onBack}
              disabled={loading}
            >
              Retour
            </Button>
          )}
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={onRegister}
            disabled={loading}
            size="large"
            sx={{ ml: onBack ? 'auto' : 0 }}
          >
            {loading ? 'Enregistrement...' : 'Suivant'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

