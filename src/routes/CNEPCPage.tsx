import React, { useState } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  AppBar, 
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Send, 
  School, 
  People, 
  Assignment, 
  TrendingUp,
  AutoAwesome,
  PersonAdd
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';
import { CompleteSetup } from '../modules/cnepc';

const CNEPCPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCompleteSetup, setShowCompleteSetup] = useState(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: '#f57c00' }}>
        <Toolbar>
          
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CENTRE NATIONAL D'EXAMEN DU PERMIS DE CONDUIRE
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
        service examen et Validation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Interface de gestion des auto-écoles et des candidats au permis de conduire
        </Typography>
        
        {/* Menu des modules CNEPC */}
        <Grid container spacing={3}>
          {/* Module Gestion des Auto-Écoles */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Gestion des Auto-Écoles
                    </Typography>
                    <Chip 
                      label="Module Principal" 
                      color="primary" 
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Gérez vos auto-écoles, consultez les candidats inscrits, 
                  suivez l'avancement des dossiers et analysez les statistiques.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<People />} label="Candidats" size="small" />
                  <Chip icon={<Assignment />} label="Dossiers" size="small" />
                  <Chip icon={<TrendingUp />} label="Statistiques" size="small" />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<School />}
                  onClick={() => navigate(ROUTES.AUTO_ECOLES)}
                  sx={{ py: 1.5, mb: 1 }}
                >
                  Accéder au Module
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonAdd />}
                  onClick={() => setShowCompleteSetup(true)}
                  sx={{ py: 1.5 }}
                >
                  Configuration Complète
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Module Envoi au CNEPC */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <Send />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Reception au CNEPC
                    </Typography>
                    <Chip 
                      label="Bientôt Disponible" 
                      color="secondary" 
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Interface de reception  des dossiers candidats au CNEPC
                  
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<AutoAwesome />} label="Validation" size="small" />
                  <Chip icon={<Send />} label="Transmission" size="small" />
                  <Chip icon={<Assignment />} label="Suivi" size="small" />
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Send />}
                  disabled
                  sx={{ py: 1.5 }}
                >
                  Module en Développement
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Statistiques rapides */}
          <Grid item xs={12}>
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vue d'ensemble du système
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                        <School />
                      </Avatar>
                      <Typography variant="h4" color="primary">
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Auto-Écoles
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                        <People />
                      </Avatar>
                      <Typography variant="h4" color="info.main">
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Candidats
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                        <Assignment />
                      </Avatar>
                      <Typography variant="h4" color="warning.main">
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dossiers
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                        <TrendingUp />
                      </Avatar>
                      <Typography variant="h4" color="success.main">
                        0
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Validés
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Configuration Complète */}
      <CompleteSetup
        open={showCompleteSetup}
        onComplete={() => {
          setShowCompleteSetup(false);
          navigate(ROUTES.AUTO_ECOLES);
        }}
        onCancel={() => setShowCompleteSetup(false)}
      />
    </Box>
  );
};

export default CNEPCPage;
