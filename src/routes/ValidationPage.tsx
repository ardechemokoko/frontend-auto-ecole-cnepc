import React from 'react';
import { Typography, Container, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';

const ValidationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#388e3c' }}>
        <Toolbar>
          <IconButton 
            color="inherit" 
            onClick={() => navigate(ROUTES.DASHBOARD)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <CheckCircle sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Validation des dossiers
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Validation des dossiers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interface de validation des dossiers des élèves.
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Module de validation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette page intégrera les composants de validation des dossiers.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ValidationPage;
