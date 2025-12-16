import React from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface CNEDDTButtonProps {
  allEtapesCompleted: boolean;
  dossierId?: string;
  epreuvesStatus?: string;
  loadingEpreuves: boolean;
  sendingToCNEDDT: boolean;
  onSendToCNEDDT: () => void;
}

export const CNEDDTButton: React.FC<CNEDDTButtonProps> = ({
  allEtapesCompleted,
  dossierId,
  epreuvesStatus,
  loadingEpreuves,
  sendingToCNEDDT,
  onSendToCNEDDT
}) => {
  // Vérifier si les épreuves sont requises
  const hasEpreuves = epreuvesStatus && epreuvesStatus !== 'non_saisi' && epreuvesStatus.trim() !== '';
  const epreuvesValid = !hasEpreuves || epreuvesStatus === 'reussi';
  
  const isButtonDisabled = sendingToCNEDDT || !dossierId || !allEtapesCompleted || !epreuvesValid || loadingEpreuves;
  
  if (!allEtapesCompleted) return null;
  
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

