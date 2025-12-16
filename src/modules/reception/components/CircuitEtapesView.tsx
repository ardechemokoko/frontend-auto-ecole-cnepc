import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  circuitSuiviService,
  CircuitSuivi,
  EtapeCircuit,
  Document
} from '../services/circuit-suivi.service';
import EtapeDetails from './EtapeDetails';
import axiosClient from '../../../shared/environment/envdev';

interface CircuitEtapesViewProps {
  circuit: CircuitSuivi;
  dossierId?: string;
  onEtapeChange?: (etape: EtapeCircuit) => void;
}

const CircuitEtapesView: React.FC<CircuitEtapesViewProps> = ({
  circuit,
  dossierId,
  onEtapeChange
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [etapes, setEtapes] = useState<EtapeCircuit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les étapes du circuit
  useEffect(() => {
    const loadEtapes = async () => {
      if (!circuit.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Si le circuit a déjà des étapes, les utiliser
        if (circuit.etapes && circuit.etapes.length > 0) {
          // Trier les étapes par code
          const sortedEtapes = [...circuit.etapes].sort((a, b) => {
            return (a.code || '').localeCompare(b.code || '');
          });
          setEtapes(sortedEtapes);
        } else {
          // Sinon, essayer de charger depuis l'API
          try {
            const response = await axiosClient.get(`/workflow/etapes`, {
              params: { circuit_id: circuit.id }
            });
            const data = response.data;
            const sortedEtapes = Array.isArray(data) ? data : (data.data || []);
            sortedEtapes.sort((a: EtapeCircuit, b: EtapeCircuit) => {
              return (a.code || '').localeCompare(b.code || '');
            });
            setEtapes(sortedEtapes);
          } catch (err) {
            console.error('Erreur lors du chargement des étapes depuis l\'API:', err);
          }
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des étapes:', err);
        setError('Erreur lors du chargement des étapes');
      } finally {
        setLoading(false);
      }
    };

    loadEtapes();
  }, [circuit]);

  // Charger les documents du dossier
  useEffect(() => {
    const loadDocuments = async () => {
      if (!dossierId) {
        setDocuments([]);
        return;
      }

      try {
        const docs = await circuitSuiviService.getDocumentsByDossier(dossierId);
        setDocuments(docs);
      } catch (err: any) {
        console.error('Erreur lors du chargement des documents:', err);
        setDocuments([]);
      }
    };

    loadDocuments();
  }, [dossierId]);

  // Écouter les événements de document uploadé
  useEffect(() => {
    const handleDocumentUploaded = async () => {
      if (dossierId) {
        const docs = await circuitSuiviService.getDocumentsByDossier(dossierId);
        setDocuments(docs);
      }
    };

    window.addEventListener('documentUploaded', handleDocumentUploaded);
    return () => {
      window.removeEventListener('documentUploaded', handleDocumentUploaded);
    };
  }, [dossierId]);

  // Détecter l'étape active (première étape en attente ou en cours)
  useEffect(() => {
    if (etapes.length > 0 && onEtapeChange) {
      const activeEtape = etapes[activeTab] || etapes[0];
      onEtapeChange(activeEtape);
    }
  }, [etapes, activeTab, onEtapeChange]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (etapes[newValue] && onEtapeChange) {
      onEtapeChange(etapes[newValue]);
    }
  };

  const handleDocumentUploaded = async () => {
    if (dossierId) {
      const docs = await circuitSuiviService.getDocumentsByDossier(dossierId);
      setDocuments(docs);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (etapes.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Aucune étape définie pour ce circuit.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {etapes.map((etape, index) => (
            <Tab
              key={etape.id}
              label={etape.libelle}
              sx={{ textTransform: 'none' }}
            />
          ))}
        </Tabs>
      </Paper>

      {etapes.map((etape, index) => (
        <Box
          key={etape.id}
          role="tabpanel"
          hidden={activeTab !== index}
          id={`etape-tabpanel-${index}`}
          aria-labelledby={`etape-tab-${index}`}
        >
          {activeTab === index && (
            <EtapeDetails
              etape={etape}
              circuitId={circuit.id || ''}
              etapeIndex={index}
              isActive={activeTab === index}
              isCompleted={false}
              isBlocked={false}
              uploadedDocuments={documents}
              dossierId={dossierId}
              onDocumentUploaded={handleDocumentUploaded}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CircuitEtapesView;

