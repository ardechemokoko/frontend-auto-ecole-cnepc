import React from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const menuItems = [
    {
      title: 'Élèves',
      description: 'Gérer les élèves et leurs dossiers',
      icon: React.createElement(SchoolIcon, { sx: { fontSize: 40 } }),
      path: ROUTES.ELEVES,
      color: '#1976d2'
    },
    {
      title: 'Validation',
      description: 'Valider les dossiers des élèves',
      icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 40 } }),
      path: ROUTES.VALIDATION,
      color: '#388e3c'
    },
    {
      title: 'CNEPC',
      description: 'Envoyer les dossiers au CNEPC',
      icon: React.createElement(SendIcon, { sx: { fontSize: 40 } }),
      path: ROUTES.CNEPC,
      color: '#f57c00'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Barre de navigation */}
      <AppBar position="static" sx={{ backgroundColor: '#50C786' }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            DGTT Auto-École
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Bonjour, {user?.name || 'Utilisateur'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Contenu principal */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tableau de bord
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenue sur le tableau de bord de l'application DGTT Auto-École.
          </Typography>
        </Box>

        {/* Cartes de navigation */}
        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: item.color, mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      mt: 2,
                      backgroundColor: item.color,
                      '&:hover': { backgroundColor: item.color, opacity: 0.9 }
                    }}
                    fullWidth
                  >
                    Accéder
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Statistiques rapides */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Statistiques rapides
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Élèves en attente
                  </Typography>
                  <Typography variant="h4">
                    12
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Dossiers validés
                  </Typography>
                  <Typography variant="h4">
                    45
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Envoyés au CNEPC
                  </Typography>
                  <Typography variant="h4">
                    8
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardPage;