import React, { useState } from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import DemandesInscriptionTable from '../tables/DemandesInscriptionTable';
import CandidatDetailsSheet from '../components/CandidatDetailsSheet';
import { DemandeInscription } from '../types/inscription';

const DemandesInscriptionPage: React.FC = () => {
  const [selectedCandidat, setSelectedCandidat] = useState<DemandeInscription | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCandidatSelect = (candidat: DemandeInscription) => {
    setSelectedCandidat(candidat);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedCandidat(null);
  };

  const handleValidationSuccess = () => {
    console.log('Demande validée avec succès - l\'élève a été transféré vers StudentsTable');
    // Rafraîchir la liste des demandes pour supprimer la demande validée
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'gray-100' }}>
      <Typography variant="h4" component="h1" gutterBottom className="font-display p-4">
        Demandes d'inscription
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} className="font-primary p-4 ">
        Gestion des demandes d'inscription des élèves
      </Typography>

      <DemandesInscriptionTable 
        onCandidatSelect={handleCandidatSelect} 
        refreshTrigger={refreshTrigger}
        
      />
      
      <CandidatDetailsSheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        candidat={selectedCandidat}
        onValidationSuccess={handleValidationSuccess}
      />
    </Box>
  );
};

export default DemandesInscriptionPage;
