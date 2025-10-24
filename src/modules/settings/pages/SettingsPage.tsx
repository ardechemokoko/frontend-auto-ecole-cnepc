import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const theme = useTheme();

  const settingsCards = [
    {
      title: 'Gestion d\'utilisateurs',
      description: 'Créer et gérer les comptes opérateurs',
      icon: PeopleIcon,
      path: '/settings/users',
      color: theme.palette.primary.main
    },
    {
      title: 'Configuration système',
      description: 'Paramètres généraux de l\'application',
      icon: SettingsIcon,
      path: '/settings/system',
      color: theme.palette.secondary.main
    },
    {
      title: 'Référentiels',
      description: 'Gérer les données de référence',
      icon: BusinessIcon,
      path: '/settings/referentiels',
      color: theme.palette.success.main
    },
    {
      title: 'Rapports',
      description: 'Statistiques et rapports du système',
      icon: AssessmentIcon,
      path: '/settings/reports',
      color: theme.palette.warning.main
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Paramètres du Système
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configuration et gestion des paramètres de l'application
      </Typography>

      <Grid container spacing={3}>
        {settingsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1.5,
                      mr: 2
                    }}
                  >
                    <card.icon />
                  </Box>
                  <Box>
                    <Typography variant="h6" component="div">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions Rapides
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Créer un nouveau compte opérateur
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Configurer les paramètres système
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Consulter les logs d'activité
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informations Système
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Version: 1.0.0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Dernière mise à jour: 15/01/2024
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Statut: Opérationnel
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
