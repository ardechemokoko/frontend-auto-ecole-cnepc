import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CheckCircle, Person, School } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { AutoEcoleFormData, AutoEcole, autoEcoleService, referentielService, Referentiel } from '../services';
import { useAppStore } from '../../../store';

interface AutoEcoleFormProps {
  autoEcole?: AutoEcole;
  onSuccess: (autoEcole: AutoEcole) => void;
  onCancel: () => void;
  open: boolean;
  responsableId?: string; // ID du responsable pour lequel créer l'auto-école
  responsableInfo?: {
    nom: string;
    prenom: string;
    email: string;
    contact: string;
  };
}

const AutoEcoleForm: React.FC<AutoEcoleFormProps> = ({
  autoEcole,
  onSuccess,
  onCancel,
  open,
  responsableId,
  responsableInfo,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Referentiel[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const { user } = useAppStore();

  // Détermine si on est en mode création avec responsable fourni
  const isCreationWithResponsable = !autoEcole && responsableId && responsableInfo;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AutoEcoleFormData>({
    defaultValues: {
      nom_auto_ecole: '',
      adresse: '',
      email: '',
      contact: '',
      statut: true,
      responsable_id: responsableId || user?.id || '',
      province_id: '',
    },
  });

  // Charger les provinces au montage du composant
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provincesData = await referentielService.getReferentielsByType('province');
        setProvinces(provincesData);
      } catch (error) {
        console.error('Erreur lors du chargement des provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Réinitialiser le formulaire quand l'auto-école change
  useEffect(() => {
    if (autoEcole) {
      reset({
        nom_auto_ecole: autoEcole.nom_auto_ecole,
        adresse: autoEcole.adresse,
        email: autoEcole.email,
        contact: autoEcole.contact,
        statut: autoEcole.statut,
        responsable_id: autoEcole.responsable_id,
        province_id: (autoEcole as any).province_id || '',
      });
    } else {
      reset({
        nom_auto_ecole: '',
        adresse: '',
        email: '',
        contact: '',
        statut: true,
        responsable_id: responsableId || user?.id || '',
        province_id: '',
      });
    }
  }, [autoEcole, reset, user, responsableId]);

  const onSubmit = async (data: AutoEcoleFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 🔍 DEBUG: Afficher les informations de soumission
    console.log('📋 === SOUMISSION DU FORMULAIRE AUTO-ÉCOLE ===');
    console.log('👤 Utilisateur connecté:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      personne: user?.personne
    });
    console.log('📝 Données du formulaire:', data);
    console.log('🆔 ID du responsable fourni:', responsableId);
    console.log('👔 Infos du responsable:', responsableInfo);
    console.log('✏️ Mode:', autoEcole ? 'Mise à jour' : 'Création');

    // ✅ Validation: S'assurer que responsable_id est bien fourni
    if (!data.responsable_id) {
      setError('❌ L\'ID du responsable est manquant. Impossible de créer l\'auto-école.');
      setLoading(false);
      return;
    }

    // ✅ Vérification des permissions (sauf en mode création avec responsable fourni)
    if (!isCreationWithResponsable && responsableId && responsableId !== user?.id && user?.role !== 'admin') {
      setError('🚫 Seul un administrateur peut créer une auto-école pour un autre utilisateur.');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (autoEcole) {
        // 🔄 Mise à jour d'une auto-école existante
        console.log('🔄 Mise à jour de l\'auto-école:', autoEcole.id);
        response = await autoEcoleService.updateAutoEcole(autoEcole.id, data);
      } else {
        // ➕ Création d'une nouvelle auto-école
        console.log('➕ Création d\'une nouvelle auto-école');
        console.log('📤 Payload envoyé à l\'API:', JSON.stringify(data, null, 2));
        response = await autoEcoleService.createAutoEcole(data);
      }

      // ✅ Vérification de la réponse
      if (response.success && response.data) {
        console.log('✅ === SUCCÈS DE LA CRÉATION ===');
        console.log('🏫 Auto-école créée:', response.data);
        console.log('📊 Formations incluses:', response.data.formations?.length || 0);
        console.log('📁 Dossiers inclus:', response.data.dossiers?.length || 0);
        
        setSuccess(response.message || 'Auto-école créée avec succès !');
        
        // 🎉 Attendre un peu pour que l'utilisateur voie le message de succès
        setTimeout(() => {
          onSuccess(response.data!);
        }, 1500);
      } else {
        console.error('❌ Échec de la réponse:', response);
        setError(response.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      console.error('💥 === ERREUR LORS DE LA SOUMISSION ===');
      console.error('Erreur complète:', err);
      console.error('Réponse de l\'erreur:', err.response);
      
      // 🔍 Extraire et afficher le message d'erreur approprié
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Une erreur inattendue est survenue lors de la sauvegarde';
      
      setError(`❌ ${errorMessage}`);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <School color="primary" />
          <Typography variant="h5" component="span">
            {autoEcole ? 'Modifier l\'auto-école' : 'Créer une auto-école'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Stepper pour montrer le processus en 2 étapes */}
        {isCreationWithResponsable && (
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={1} alternativeLabel>
              <Step completed>
                <StepLabel icon={<CheckCircle color="success" />}>
                  Responsable créé
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>Créer l'auto-école</StepLabel>
              </Step>
            </Stepper>
          </Box>
        )}

        {/* Afficher les informations du responsable créé */}
        {isCreationWithResponsable && responsableInfo && (
          <Card sx={{ mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Person color="success" />
                <Typography variant="h6" color="success.dark">
                  ✅ Responsable créé avec succès
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Nom complet
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {responsableInfo.prenom} {responsableInfo.nom}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {responsableInfo.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body1">
                    {responsableInfo.contact}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    ID du responsable
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {responsableId}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          {/* Message de succès */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
              <Typography variant="body1" fontWeight="bold">
                {success}
              </Typography>
            </Alert>
          )}

          {/* Message d'erreur */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}

          {/* Vérification des permissions */}
          {user?.role !== 'responsable_auto_ecole' && user?.role !== 'admin' && !isCreationWithResponsable && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>⚠️ Attention :</strong> Seuls les responsables d'auto-école et les administrateurs peuvent créer ou modifier des auto-écoles.
                <br />
                Votre rôle actuel : <strong>{user?.role || 'Non défini'}</strong>
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="nom_auto_ecole"
                control={control}
                rules={{ required: 'Le nom de l\'auto-école est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nom de l'auto-école"
                    fullWidth
                    error={!!errors.nom_auto_ecole}
                    helperText={errors.nom_auto_ecole?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="adresse"
                control={control}
                rules={{ required: 'L\'adresse est requise' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Adresse"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.adresse}
                    helperText={errors.adresse?.message}
                    required
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
                    message: 'Email invalide'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    required
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
                    error={!!errors.contact}
                    helperText={errors.contact?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="province_id"
                control={control}
                rules={{ required: 'La province est requise' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.province_id} required>
                    <InputLabel id="province-label">Province</InputLabel>
                    <Select
                      {...field}
                      labelId="province-label"
                      label="Province"
                      disabled={loadingProvinces}
                    >
                      {loadingProvinces ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Chargement...
                        </MenuItem>
                      ) : provinces.length === 0 ? (
                        <MenuItem disabled>Aucune province disponible</MenuItem>
                      ) : (
                        provinces.map((province) => (
                          <MenuItem key={province.id} value={province.id}>
                            {province.libelle}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {errors.province_id && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.province_id.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="statut"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label="Auto-école active"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="responsable_id"
                control={control}
                rules={{ required: 'Le responsable est requis' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID du responsable"
                    fullWidth
                    error={!!errors.responsable_id}
                    helperText={errors.responsable_id?.message}
                    required
                    disabled={!!autoEcole} // L'ID du responsable ne peut pas être modifié
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
          disabled={loading || (!isCreationWithResponsable && user?.role !== 'responsable_auto_ecole' && user?.role !== 'admin')}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Sauvegarde...' : (autoEcole ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutoEcoleForm;
