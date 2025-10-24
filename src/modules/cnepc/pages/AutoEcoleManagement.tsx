import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  School,
  People,
  Assignment,
  TrendingUp,
  Add,
  Visibility,
} from '@mui/icons-material';
import { AutoEcoleTable, CandidatsTable } from '../tables';
import { AutoEcole, autoEcoleService } from '../services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auto-ecole-tabpanel-${index}`}
      aria-labelledby={`auto-ecole-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AutoEcoleManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedAutoEcole, setSelectedAutoEcole] = useState<AutoEcole | null>(null);
  const [autoEcoleStats, setAutoEcoleStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Charger les statistiques de l'auto-école
  const loadAutoEcoleStats = async () => {
    if (!selectedAutoEcole) return;

    setLoading(true);
    setError(null);

    try {
      const stats = await autoEcoleService.getAutoEcoleStats(selectedAutoEcole.id);
      setAutoEcoleStats(stats);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les statistiques quand une auto-école est sélectionnée
  useEffect(() => {
    if (selectedAutoEcole) {
      loadAutoEcoleStats();
    }
  }, [selectedAutoEcole]);

  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gestion de la sélection d'une auto-école
  const handleAutoEcoleSelect = (autoEcole: AutoEcole) => {
    setSelectedAutoEcole(autoEcole);
    setTabValue(1); // Passer à l'onglet des candidats
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    if (selectedAutoEcole) {
      loadAutoEcoleStats();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Gestion des Auto-Écoles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez vos auto-écoles et suivez les candidats inscrits
        </Typography>
      </Box>

      {/* Statistiques globales */}
      {selectedAutoEcole && autoEcoleStats && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Statistiques - {selectedAutoEcole.nom_auto_ecole}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <People />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="primary">
                        {autoEcoleStats.total_candidats}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Candidats total
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Assignment />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        {autoEcoleStats.dossiers_en_attente}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        En attente
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <TrendingUp />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="info.main">
                        {autoEcoleStats.dossiers_en_cours}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        En cours
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <School />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {autoEcoleStats.dossiers_valides}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Validés
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Onglets */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="auto-ecole tabs">
            <Tab label="Liste des Auto-Écoles" />
            <Tab 
              label="Candidats Inscrits" 
              disabled={!selectedAutoEcole}
            />
          </Tabs>
        </Box>

        {/* Onglet 1: Liste des auto-écoles */}
        <TabPanel value={tabValue} index={0}>
          <AutoEcoleTable
            onAutoEcoleSelect={handleAutoEcoleSelect}
            refreshTrigger={refreshTrigger}
          />
        </TabPanel>

        {/* Onglet 2: Candidats inscrits */}
        <TabPanel value={tabValue} index={1}>
          {selectedAutoEcole ? (
            <CandidatsTable
              autoEcoleId={selectedAutoEcole.id}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Sélectionnez une auto-école
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choisissez une auto-école dans la liste pour voir ses candidats inscrits
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Actions rapides */}
      {selectedAutoEcole && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => setTabValue(1)}
          >
            Voir les candidats
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleRefresh}
          >
            Actualiser
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AutoEcoleManagement;
