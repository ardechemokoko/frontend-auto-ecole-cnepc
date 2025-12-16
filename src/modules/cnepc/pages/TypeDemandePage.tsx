import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import TypeDemandeTable from '../tables/TypeDemandeTable';

const TypeDemandePage: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Typage de Dossier
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gérez les types de demande pour les dossiers candidats
        </Typography>

        <TypeDemandeTable />
      </Container>
    </Box>
  );
};

export default TypeDemandePage;

