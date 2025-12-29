import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  Stack,
  Box,
  Typography
} from '@mui/material';
import { ValidationDialogState } from '../types/circuit-etapes.types';

interface ValidationDialogProps {
  open: boolean;
  validationDialog: ValidationDialogState;
  updatingDocument: string | null;
  onClose: () => void;
  onSave: () => void;
  onValideChange: (valide: boolean) => void;
  onCommentairesChange: (commentaires: string) => void;
}

export const ValidationDialog: React.FC<ValidationDialogProps> = ({
  open,
  validationDialog,
  updatingDocument,
  onClose,
  onSave,
  onValideChange,
  onCommentairesChange
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {validationDialog.document && (
          <>Modifier le statut : {validationDialog.document.nom || validationDialog.document.nom_fichier}</>
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" className="font-primary">
              Statut de validation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color={validationDialog.valide ? 'success.main' : 'text.secondary'}>
                {validationDialog.valide ? 'Validé' : 'Non validé'}
              </Typography>
              <Switch
                checked={validationDialog.valide}
                onChange={(e) => onValideChange(e.target.checked)}
                color="success"
              />
            </Box>
          </Box>
          <TextField
            label="Commentaires"
            multiline
            rows={4}
            value={validationDialog.commentaires}
            onChange={(e) => onCommentairesChange(e.target.value)}
            placeholder="Ajouter des commentaires sur ce document..."
            fullWidth
            variant="outlined"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          disabled={updatingDocument !== null}
        >
          {updatingDocument ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

