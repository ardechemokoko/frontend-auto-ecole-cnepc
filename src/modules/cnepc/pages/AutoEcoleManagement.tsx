import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  School,
  Add,
  Visibility,
} from '@mui/icons-material';
import { AutoEcoleTable } from '../tables';
import { AutoEcole } from '../services';
import { AutoEcoleSettings } from '../components';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Gestion du changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gestion de la sélection d'une auto-écolFe
  const handleAutoEcoleSelect = (autoEcole: AutoEcole) => {
    setSelectedAutoEcole(autoEcole);
    setTabValue(1); // Passer à l'onglet des candidats
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
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

      {/* Onglets */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="auto-ecole tabs">
            <Tab label="Liste des Auto-Écoles" />
            <Tab 
              label="Paramètres" 
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

        {/* Onglet 2: Paramètres et gestion */}
        <TabPanel value={tabValue} index={1}>
          {selectedAutoEcole ? (
            <AutoEcoleSettings
              autoEcole={selectedAutoEcole}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Sélectionnez une auto-école
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choisissez une auto-école dans la liste pour gérer ses paramètres, candidats et formations
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
            Gérer l'auto-école
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
