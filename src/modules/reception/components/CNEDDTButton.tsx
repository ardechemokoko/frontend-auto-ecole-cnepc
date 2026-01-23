import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface CNEDDTButtonProps {
  allEtapesCompleted: boolean;
  dossierId?: string;
  epreuvesStatus?: string;
  loadingEpreuves: boolean;
  sendingToCNEDDT: boolean;
  sentToCNEDDT?: boolean;
  onSendToCNEDDT: () => void;
}

export const CNEDDTButton: React.FC<CNEDDTButtonProps> = ({
  allEtapesCompleted,
  dossierId,
  epreuvesStatus,
  loadingEpreuves,
  sendingToCNEDDT,
  sentToCNEDDT = false,
  onSendToCNEDDT
}) => {
  // Vérifier si les épreuves sont requises
  const hasEpreuves = epreuvesStatus && epreuvesStatus !== 'non_saisi' && epreuvesStatus.trim() !== '';
  const epreuvesValid = !hasEpreuves || epreuvesStatus === 'reussi';
  
  const isButtonDisabled = sendingToCNEDDT || !dossierId || !allEtapesCompleted || !epreuvesValid || loadingEpreuves;
  
  if (!allEtapesCompleted) return null;
  
  // Si le dossier a été envoyé avec succès, afficher le message de succès
  if (sentToCNEDDT) {
    return (
      <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid', borderColor: 'divider' }}>
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon className="w-6 h-6" />}
          sx={{
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="h6" fontWeight="bold" className="font-display" gutterBottom>
            DOSSIER ENVOYÉ POUR IMPRESSION DE LA CARTE
          </Typography>
          <Typography variant="body2" className="font-primary">
            Le dossier a été envoyé avec succès à la CNEDDT pour l'impression de la carte.
          </Typography>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight="bold" className="font-display" gutterBottom>
            Toutes les étapes sont complétées
          </Typography>
          <Typography variant="body2" color="text.secondary" className="font-primary">
            {hasEpreuves && epreuvesStatus !== 'reussi'
              ? 'Toutes les épreuves doivent être validées pour envoyer à la CNEDDT'
              : 'Le dossier est prêt à être envoyé à la CNEDDT'}
          </Typography>
        </Box>
        <Tooltip 
          title={
            !allEtapesCompleted 
              ? 'Toutes les étapes du circuit doivent être complétées pour envoyer à la CNEDDT' 
              : hasEpreuves && epreuvesStatus !== 'reussi'
                ? 'Toutes les épreuves doivent être validées pour envoyer à la CNEDDT' 
                : 'Envoyer le dossier à la CNEDDT'
          }
        >
          <span>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              startIcon={sendingToCNEDDT ? <CircularProgress size={20} /> : <PaperAirplaneIcon className="w-6 h-6" />}
              onClick={onSendToCNEDDT}
              disabled={isButtonDisabled}
              className="font-primary"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5
              }}
            >
              {sendingToCNEDDT ? 'Envoi en cours...' : 'Envoyer à la CNEDDT'}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

