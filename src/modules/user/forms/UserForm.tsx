import React, { useState, useEffect } from 'react';
import {
  Box,
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
import { userService } from '../services';
import { UserFormData, User } from '../types';

interface UserFormProps {
  user?: User;
  onSuccess: (user: User) => void;
  onCancel: () => void;
  open: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSuccess,
  onCancel,
  open,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!user;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
      nom: '',
      prenom: '',
      contact: '',
      telephone: '',
      adresse: '',
      role: 'ROLE_AUTO_ECOLE',
    },
  });

  useEffect(() => {
    if (user && open) {
      reset({
        email: user.email || '',
        password: '',
        password_confirmation: '',
        nom: user.personne?.nom || '',
        prenom: user.personne?.prenom || '',
        contact: user.personne?.contact || '',
        telephone: user.telephone || user.personne?.telephone || '',
        adresse: user.personne?.adresse || '',
        role: user.role as any || 'ROLE_AUTO_ECOLE',
      });
    } else if (!user && open) {
      reset({
        email: '',
        password: '',
        password_confirmation: '',
        nom: '',
        prenom: '',
        contact: '',
        telephone: '',
        adresse: '',
        role: 'ROLE_AUTO_ECOLE',
      });
    }
  }, [user, open, reset]);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);

    try {
      let response: User;
      if (isEditMode && user) {
        // Mise à jour - ne pas envoyer le mot de passe si vide
        const updateData: Partial<UserFormData> = { ...data };
        if (!updateData.password) {
          delete updateData.password;
          delete updateData.password_confirmation;
        }
        response = await userService.updateUser(user.id, updateData);
      } else {
        // Création
        response = await userService.createUser(data);
      }
      
      onSuccess(response);
      handleClose();
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde');
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
        {isEditMode ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
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
                name="nom"
                control={control}
                rules={{ required: 'Le nom est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nom"
                    fullWidth
                    required
                    error={!!errors.nom}
                    helperText={errors.nom?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="prenom"
                control={control}
                rules={{ required: 'Le prénom est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Prénom"
                    fullWidth
                    required
                    error={!!errors.prenom}
                    helperText={errors.prenom?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading || isEditMode}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="contact"
                control={control}
                rules={{ required: 'Le contact est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact"
                    fullWidth
                    required
                    error={!!errors.contact}
                    helperText={errors.contact?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="telephone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Téléphone (optionnel)"
                    fullWidth
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="role"
                control={control}
                rules={{ required: 'Le rôle est requis' }}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.role}>
                    <InputLabel>Rôle</InputLabel>
                    <Select
                      {...field}
                      label="Rôle"
                      disabled={loading}
                    >
                      <MenuItem value="ROLE_AUTO_ECOLE">Auto-École</MenuItem>
                      <MenuItem value="ROLE_ADMIN">Administrateur</MenuItem>
                      <MenuItem value="ROLE_CNEPC">CNEPC</MenuItem>
                      <MenuItem value="ROLE_CNEDDT">CNEDDT</MenuItem>
                      <MenuItem value="candidat">Candidat</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="adresse"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Adresse (optionnel)"
                    fullWidth
                    multiline
                    rows={2}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {!isEditMode && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: !isEditMode ? 'Le mot de passe est requis' : false,
                      minLength: {
                        value: 8,
                        message: 'Le mot de passe doit contenir au moins 8 caractères',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mot de passe"
                        type="password"
                        fullWidth
                        required={!isEditMode}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        disabled={loading}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password_confirmation"
                    control={control}
                    rules={{
                      required: !isEditMode ? 'La confirmation du mot de passe est requise' : false,
                      validate: (value, formValues) =>
                        value === formValues.password || 'Les mots de passe ne correspondent pas',
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Confirmer le mot de passe"
                        type="password"
                        fullWidth
                        required={!isEditMode}
                        error={!!errors.password_confirmation}
                        helperText={errors.password_confirmation?.message}
                        disabled={loading}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {isEditMode && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      minLength: {
                        value: 8,
                        message: 'Le mot de passe doit contenir au moins 8 caractères',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nouveau mot de passe (optionnel)"
                        type="password"
                        fullWidth
                        error={!!errors.password}
                        helperText={errors.password?.message || 'Laissez vide pour ne pas modifier'}
                        disabled={loading}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password_confirmation"
                    control={control}
                    rules={{
                      validate: (value, formValues) => {
                        if (formValues.password && value !== formValues.password) {
                          return 'Les mots de passe ne correspondent pas';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        fullWidth
                        error={!!errors.password_confirmation}
                        helperText={errors.password_confirmation?.message}
                        disabled={loading}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Enregistrement...' : isEditMode ? 'Modifier' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;

