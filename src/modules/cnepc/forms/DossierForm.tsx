import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { DossierFormData, Dossier, Formation, autoEcoleService } from '../services';

interface DossierFormProps {
  dossier?: Dossier;
  onSuccess: (dossier: Dossier) => void;
  onCancel: () => void;
  open: boolean;
  autoEcoleId?: string;
}

const DossierForm: React.FC<DossierFormProps> = ({
  dossier,
  onSuccess,
  onCancel,
  open,
  autoEcoleId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DossierFormData>({
    defaultValues: {
      candidat_id: '',
      auto_ecole_id: autoEcoleId || '',
      formation_id: '',
      numero_dossier: '',
      statut: 'en_attente',
      date_creation: new Date().toISOString().split('T')[0],
      commentaires: '',
    },
  });

  // Charger les formations de l'auto-école
  useEffect(() => {
    if (autoEcoleId) {
      loadFormations();
    }
  }, [autoEcoleId]);

  const loadFormations = async () => {
    if (!autoEcoleId) return;
    
    setLoadingFormations(true);
    try {
      const formationsData = await autoEcoleService.getFormationsByAutoEcole(autoEcoleId);
      setFormations(formationsData);
    } catch (err) {
      console.error('Erreur lors du chargement des formations:', err);
    } finally {
      setLoadingFormations(false);
    }
  };

  // Réinitialiser le formulaire quand le dossier change
  useEffect(() => {
    if (dossier) {
      reset({
        candidat_id: dossier.candidat_id,
        auto_ecole_id: dossier.auto_ecole_id,
        formation_id: dossier.formation_id,
        numero_dossier: '',
        statut: dossier.statut,
        date_creation: dossier.date_creation,
        commentaires: dossier.commentaires || '',
      });
    } else {
      reset({
        candidat_id: '',
        auto_ecole_id: autoEcoleId || '',
        formation_id: '',
        numero_dossier: '',
        statut: 'en_attente',
        date_creation: new Date().toISOString().split('T')[0],
        commentaires: '',
      });
    }
  }, [dossier, autoEcoleId, reset]);

  const onSubmit = async (data: DossierFormData) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (dossier) {
        // Mise à jour
        response = await autoEcoleService.updateDossier(dossier.id, data);
      } else {
        // Création
        response = await autoEcoleService.createDossier(data);
      }

      if (response.success) {
        onSuccess(response.data);
      } else {
        setError(response.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('Erreur lors de la soumission:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Une erreur est survenue lors de la sauvegarde'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {dossier ? 'Modifier le dossier' : 'Créer un dossier de candidature'}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="candidat_id"
                control={control}
                rules={{ required: 'Le candidat est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID du candidat"
                    fullWidth
                    error={!!errors.candidat_id}
                    helperText={errors.candidat_id?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="auto_ecole_id"
                control={control}
                rules={{ required: 'L\'auto-école est requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID de l'auto-école"
                    fullWidth
                    error={!!errors.auto_ecole_id}
                    helperText={errors.auto_ecole_id?.message}
                    required
                    disabled={!!autoEcoleId} // L'ID de l'auto-école ne peut pas être modifié
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="formation_id"
                control={control}
                rules={{ required: 'La formation est requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.formation_id}>
                    <InputLabel>Formation</InputLabel>
                    <Select
                      {...field}
                      label="Formation"
                      disabled={loadingFormations}
                    >
                      {formations.map((formation) => (
                        <MenuItem key={formation.id} value={formation.id}>
                          {formation.nom} - {formation.prix}€
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.formation_id && (
                      <Typography variant="caption" color="error">
                        {errors.formation_id.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="numero_dossier"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Numéro de dossier"
                    fullWidth
                    error={!!errors.numero_dossier}
                    helperText={errors.numero_dossier?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="statut"
                control={control}
                rules={{ required: 'Le statut est requis' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.statut}>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      {...field}
                      label="Statut"
                    >
                      <MenuItem value="en_attente">En attente</MenuItem>
                      <MenuItem value="en_cours">En cours</MenuItem>
                      <MenuItem value="valide">Validé</MenuItem>
                      <MenuItem value="rejete">Rejeté</MenuItem>
                    </Select>
                    {errors.statut && (
                      <Typography variant="caption" color="error">
                        {errors.statut.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="date_creation"
                control={control}
                rules={{ required: 'La date de création est requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date de création"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date_creation}
                    helperText={errors.date_creation?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="commentaires"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Commentaires"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.commentaires}
                    helperText={errors.commentaires?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Sauvegarde...' : (dossier ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DossierForm;
