import React from 'react';
import { Grid, Typography, TextField, Divider, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';
import { PersonAdd, ArrowBack } from '@mui/icons-material';
import { CandidatData } from '../types';

interface CandidatFormStepProps {
  candidatData: CandidatData;
  loading: boolean;
  onCandidatDataChange: (data: CandidatData) => void;
  onCreateCandidat: () => Promise<void>;
  onBack?: () => void;
  error?: string | null;
}

export const CandidatFormStep: React.FC<CandidatFormStepProps> = ({
  candidatData,
  loading,
  onCandidatDataChange,
  onCreateCandidat,
  onBack,
  error,
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Informations de naissance
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date de naissance"
          type="date"
          value={candidatData.date_naissance}
          onChange={(e) => onCandidatDataChange({ ...candidatData, date_naissance: e.target.value })}
          fullWidth
          required
          disabled={loading}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Lieu de naissance"
          value={candidatData.lieu_naissance}
          onChange={(e) => onCandidatDataChange({ ...candidatData, lieu_naissance: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Identification
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="NIP (Numéro d'Identification Personnel)"
          value={candidatData.nip}
          onChange={(e) => onCandidatDataChange({ ...candidatData, nip: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Type de pièce</InputLabel>
          <Select
            value={candidatData.type_piece}
            onChange={(e) => onCandidatDataChange({ ...candidatData, type_piece: e.target.value })}
            label="Type de pièce"
            disabled={loading}
          >
            <MenuItem value="CNI">Carte Nationale d'Identité</MenuItem>
            <MenuItem value="Passeport">Passeport</MenuItem>
            <MenuItem value="Permis_conduire">Permis de conduire</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Numéro de pièce"
          value={candidatData.numero_piece}
          onChange={(e) => onCandidatDataChange({ ...candidatData, numero_piece: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Nationalité"
          value={candidatData.nationalite}
          onChange={(e) => onCandidatDataChange({ ...candidatData, nationalite: e.target.value })}
          fullWidth
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Genre</InputLabel>
          <Select
            value={candidatData.genre}
            onChange={(e) => onCandidatDataChange({ ...candidatData, genre: e.target.value })}
            label="Genre"
            disabled={loading}
          >
            <MenuItem value="M">Masculin</MenuItem>
            <MenuItem value="F">Féminin</MenuItem>
          </Select>
        </FormControl>
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
            startIcon={<PersonAdd />}
            onClick={onCreateCandidat}
            disabled={loading}
            size="large"
            sx={{ ml: onBack ? 'auto' : 0 }}
          >
            {loading ? 'Création...' : 'Créer le candidat'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

