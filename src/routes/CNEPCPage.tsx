import React from 'react';
import { Typography, Container, Box, AppBar, Toolbar, IconButton } from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';

const CNEPCPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#f57c00' }}>
        <Toolbar>
          <IconButton 
            color="inherit" 
            onClick={() => navigate(ROUTES.DASHBOARD)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Send sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Envoi au CNEPC
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Envoi au CNEPC
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interface d'envoi des dossiers au CNEPC.
        </Typography>
        
        <Box sx={{ mt: 4, p: 3, border: '1px dashed #ccc', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Module CNEPC
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette page intégrera les composants d'envoi au CNEPC.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default CNEPCPage;
