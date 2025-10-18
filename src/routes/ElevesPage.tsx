import React from 'react';
import { Typography, Container, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import { ArrowBack, School } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';

const ElevesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          <IconButton 
            color="inherit" 
            onClick={() => navigate(ROUTES.DASHBOARD)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestion des élèves
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion des élèves
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interface de gestion des élèves et de leurs dossiers.
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Module des élèves
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette page intégrera les composants de gestion des élèves.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ElevesPage;
