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
  List,
  Settings,
  Person,
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
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, width: '100%' }}>{children}</Box>}
    </div>
  );
}

const AutoEcoleManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settingsTabValue, setSettingsTabValue] = useState(0);
  const [selectedAutoEcole, setSelectedAutoEcole] = useState<AutoEcole | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Gestion du changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Réinitialiser le sous-onglet des paramètres si on change d'onglet principal
    if (newValue !== 1) {
      setSettingsTabValue(0);
    }
  };

  // Gestion du changement de sous-onglet des paramètres
  const handleSettingsTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSettingsTabValue(newValue);
    // S'assurer qu'on est sur l'onglet Paramètres
    setTabValue(1);
  };

  // Gestion de la sélection d'une auto-école
  const handleAutoEcoleSelect = (autoEcole: AutoEcole) => {
    setSelectedAutoEcole(autoEcole);
    setTabValue(1); // Passer à l'onglet des paramètres
    setSettingsTabValue(0); // Réinitialiser au premier sous-onglet
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
      <Paper sx={{ width: '100%', display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Tabs
            orientation="vertical"
            value={tabValue}
            onChange={handleTabChange}
            aria-label="auto-ecole tabs"
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              minWidth: 200,
              alignSelf: 'flex-start',
              '& .MuiTab-root': {
                minHeight: 40,
                padding: '6px 16px',
                textTransform: 'none',
                fontSize: '0.875rem',
                justifyContent: 'flex-start',
              },
              '& .MuiTabs-indicator': {
                width: 3,
              },
            }}
          >
            <Tab 
              icon={<List />}
              iconPosition="start"
              label="Liste des Auto-Écoles" 
            />
            <Tab 
              icon={<Settings />}
              iconPosition="start"
              label="Paramètres" 
              disabled={!selectedAutoEcole}
            />
          </Tabs>

          {/* Sous-onglets des paramètres */}
          {tabValue === 1 && selectedAutoEcole && (
            <Tabs
              orientation="vertical"
              value={settingsTabValue}
              onChange={handleSettingsTabChange}
              aria-label="settings sub-tabs"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                minWidth: 200,
                mt: 1,
                '& .MuiTab-root': {
                  minHeight: 36,
                  padding: '4px 16px 4px 32px',
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  justifyContent: 'flex-start',
                },
                '& .MuiTabs-indicator': {
                  width: 3,
                },
              }}
            >
              <Tab 
                icon={<Person />}
                iconPosition="start"
                label="Candidats Inscrits" 
              />
              <Tab 
                icon={<School />}
                iconPosition="start"
                label="Formations" 
              />
              <Tab 
                icon={<Settings />}
                iconPosition="start"
                label="Référentiels" 
              />
            </Tabs>
          )}
        </Box>

        {/* Contenu des onglets */}
        <Box sx={{ flex: 1 }}>
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
                defaultTab={settingsTabValue}
                hideTabs={true}
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
        </Box>
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
