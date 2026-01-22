import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, TextField, CircularProgress, Button, Typography } from '@mui/material';
import { CheckCircle, ArrowBack } from '@mui/icons-material';
import { Referentiel } from '../../services';
import { FormationData } from '../types';

interface FinalisationStepProps {
  formationData: FormationData;
  referentiels: Referentiel[];
  loadingReferentiels: boolean;
  loading: boolean;
  onFormationDataChange: (data: FormationData) => void;
  onSubmit: () => Promise<void>;
  onBack?: () => void;
  error?: string | null;
}

export const FinalisationStep: React.FC<FinalisationStepProps> = ({
  formationData,
  referentiels,
  loadingReferentiels,
  loading,
  onFormationDataChange,
  onSubmit,
  onBack,
  error,
}) => {
  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Référentiel (optionnel)</InputLabel>
        <Select
          value={formationData.referenciel_id}
          onChange={(e) => onFormationDataChange({ ...formationData, referenciel_id: e.target.value })}
          label="Référentiel (optionnel)"
          disabled={loadingReferentiels || loading}
        >
          <MenuItem value="">
            <em>Aucun référentiel</em>
          </MenuItem>
          {loadingReferentiels ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Chargement des référentiels...
            </MenuItem>
          ) : referentiels.length === 0 ? (
            <MenuItem disabled>
              Aucun référentiel disponible
            </MenuItem>
          ) : (
            referentiels.map((referentiel) => (
              <MenuItem key={referentiel.id} value={referentiel.id}>
                {referentiel.libelle} ({referentiel.code})
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <TextField
        label="Commentaires (optionnel)"
        value={formationData.commentaires}
        onChange={(e) => onFormationDataChange({ ...formationData, commentaires: e.target.value })}
        multiline
        rows={3}
        fullWidth
        placeholder="Ajoutez des notes ou commentaires concernant ce dossier..."
        disabled={loading}
      />
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {onBack && (
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            disabled={loading || loadingReferentiels}
          >
            Retour
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          onClick={onSubmit}
          disabled={loading || loadingReferentiels}
          size="large"
          sx={{ ml: onBack ? 'auto' : 0 }}
        >
          {loading ? 'Création en cours...' : 'Finaliser la création'}
        </Button>
      </Box>
    </Box>
  );
};

