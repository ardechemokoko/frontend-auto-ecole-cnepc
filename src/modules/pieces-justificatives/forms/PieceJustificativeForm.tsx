import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  MenuItem,
} from '@mui/material';
import { pieceJustificativeService } from '../services/piece-justificative.service';
import { PieceJustificative, PieceJustificativeFormData } from '../types/piece-justificative';

interface PieceJustificativeFormProps {
  pieceJustificative?: PieceJustificative;
  open: boolean;
  onSuccess: (pieceJustificative: PieceJustificative) => void;
  onCancel: () => void;
}

const PieceJustificativeForm: React.FC<PieceJustificativeFormProps> = ({
  pieceJustificative,
  open,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PieceJustificativeFormData>({
    etape_id: '',
    type_document_id: '',
    code: '',
    libelle: '',
    format_attendu: '',
    obligatoire: false,
    delivery_date: '',
    expiration_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (pieceJustificative) {
      setFormData({
        etape_id: pieceJustificative.etape_id || '',
        type_document_id: pieceJustificative.type_document_id || '',
        code: pieceJustificative.code || '',
        libelle: pieceJustificative.libelle || '',
        format_attendu: pieceJustificative.format_attendu || '',
        obligatoire: pieceJustificative.obligatoire || false,
        delivery_date: pieceJustificative.delivery_date || '',
        expiration_date: pieceJustificative.expiration_date || '',
      });
    } else {
      setFormData({
        etape_id: '',
        type_document_id: '',
        code: '',
        libelle: '',
        format_attendu: '',
        obligatoire: false,
        delivery_date: '',
        expiration_date: '',
      });
    }
    setError(null);
    setSuccess(null);
  }, [pieceJustificative, open]);

  const handleChange = (field: keyof PieceJustificativeFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
  };

  const handleSwitchChange = (field: keyof PieceJustificativeFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.code || formData.code.trim() === '') {
      setError('Le code est requis');
      return false;
    }
    if (!formData.libelle || formData.libelle.trim() === '') {
      setError('Le libellé est requis');
      return false;
    }
    if (!formData.etape_id || formData.etape_id.trim() === '') {
      setError('L\'ID de l\'étape est requis');
      return false;
    }
    if (!formData.type_document_id || formData.type_document_id.trim() === '') {
      setError('L\'ID du type de document est requis');
      return false;
    }
    return true;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let response;
      if (pieceJustificative) {
        // Mise à jour d'une pièce justificative existante
        console.log('🔄 Mise à jour de la pièce justificative:', pieceJustificative.id);
        response = await pieceJustificativeService.updatePieceJustificative(pieceJustificative.id, formData);
      } else {
        // Création d'une nouvelle pièce justificative
        console.log('➕ Création d\'une nouvelle pièce justificative');
        response = await pieceJustificativeService.createPieceJustificative(formData);
      }

      // Vérification de la réponse
      if (response.success && response.data) {
        console.log('✅ Pièce justificative sauvegardée:', response.data);
        setSuccess(response.message || 'Pièce justificative sauvegardée avec succès !');

        // Attendre un peu pour que l'utilisateur voie le message de succès
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
    setFormData({
      etape_id: '',
      type_document_id: '',
      code: '',
      libelle: '',
      format_attendu: '',
      obligatoire: false,
      delivery_date: '',
      expiration_date: '',
    });
    setError(null);
    setSuccess(null);
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pieceJustificative ? 'Modifier la pièce justificative' : 'Nouvelle pièce justificative'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            <TextField
              label="ID de l'étape"
              value={formData.etape_id}
              onChange={handleChange('etape_id')}
              required
              fullWidth
              disabled={loading}
              helperText="Entrez l'ID de l'étape"
            />

            <TextField
              label="ID du type de document"
              value={formData.type_document_id}
              onChange={handleChange('type_document_id')}
              required
              fullWidth
              disabled={loading}
              helperText="Entrez l'ID du type de document"
            />

            <TextField
              label="Code"
              value={formData.code}
              onChange={handleChange('code')}
              required
              fullWidth
              disabled={loading}
              helperText="Entrez le code de la pièce justificative"
            />

            <TextField
              label="Libellé"
              value={formData.libelle}
              onChange={handleChange('libelle')}
              required
              fullWidth
              disabled={loading}
              helperText="Entrez le libellé de la pièce justificative"
            />

            <TextField
              label="Format attendu"
              value={formData.format_attendu}
              onChange={handleChange('format_attendu')}
              fullWidth
              disabled={loading}
              helperText="Entrez le format attendu (ex: PDF, JPG, etc.)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.obligatoire}
                  onChange={handleSwitchChange('obligatoire')}
                  disabled={loading}
                />
              }
              label="Obligatoire"
            />

            <TextField
              label="Date de livraison"
              type="date"
              value={formData.delivery_date}
              onChange={handleChange('delivery_date')}
              fullWidth
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Date de livraison prévue"
            />

            <TextField
              label="Date d'expiration"
              type="date"
              value={formData.expiration_date}
              onChange={handleChange('expiration_date')}
              fullWidth
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Date d'expiration de la pièce justificative"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Enregistrement...' : pieceJustificative ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PieceJustificativeForm;

