import React, { useState } from 'react';
import { Container, Box, Typography } from '@mui/material';
import GestionDossierTable from '../tables/GestionDossierTable';
import { CreateDossierForm } from '../forms';

const GestionDossierPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDossierCreated = () => {
    // Rafraîchir la table après la création d'un dossier
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion de Dossier
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gérez tous les dossiers des candidats, consultez leur statut et effectuez les actions nécessaires
        </Typography>

        <CreateDossierForm onSuccess={handleDossierCreated} />

        <GestionDossierTable refreshTrigger={refreshTrigger} />
      </Container>
    </Box>
  );
};

export default GestionDossierPage;

