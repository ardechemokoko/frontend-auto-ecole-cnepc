import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAutoEcoleInfo, getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';
import { candidatsService, CandidatApiItem } from '../services/candidats.service';
import { formationsService, FormationApiItem } from '../services/formations.service';

const DebugInfo: React.FC = () => {
  const [candidats, setCandidats] = useState<CandidatApiItem[]>([]);
  const [formations, setFormations] = useState<FormationApiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Récupérer le token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('Aucun token trouvé');
        return;
      }

      // Charger les candidats
      const candidatsResponse = await candidatsService.getAllCandidats(token);
      setCandidats(candidatsResponse.data);

      // Charger les formations de l'auto-école
      const autoEcoleId = getAutoEcoleId();
      if (autoEcoleId) {
        const formationsData = await formationsService.getFormationsByAutoEcole(autoEcoleId, token);
        setFormations(formationsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de débogage:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoEcoleInfo = getAutoEcoleInfo();

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography>Chargement des informations de débogage...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Informations auto-école */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏫 Informations Auto-École
          </Typography>
          {autoEcoleInfo ? (
            <Box>
              <Typography variant="body2">
                <strong>Nom:</strong> {autoEcoleInfo.nom_auto_ecole}
              </Typography>
              <Typography variant="body2">
                <strong>ID:</strong> {autoEcoleInfo.id}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {autoEcoleInfo.email}
              </Typography>
              <Typography variant="body2">
                <strong>Contact:</strong> {autoEcoleInfo.contact}
              </Typography>
              <Typography variant="body2">
                <strong>Adresse:</strong> {autoEcoleInfo.adresse}
              </Typography>
              <Typography variant="body2">
                <strong>Statut:</strong> 
                <Chip 
                  label={autoEcoleInfo.statut_libelle} 
                  color={autoEcoleInfo.statut ? 'success' : 'error'} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          ) : (
            <Typography color="error">Aucune information d'auto-école trouvée</Typography>
          )}
        </CardContent>
      </Card>

      {/* Candidats */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            👥 Candidats ({candidats.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {candidats.length > 0 ? (
            <List>
              {candidats.map((candidat, index) => (
                <React.Fragment key={candidat.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${candidat.personne.prenom} ${candidat.personne.nom}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>ID:</strong> {candidat.id} | 
                            <strong> Numéro:</strong> {candidat.numero_candidat} | 
                            <strong> Email:</strong> {candidat.personne.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Contact:</strong> {candidat.personne.contact} | 
                            <strong> Nationalité:</strong> {candidat.nationalite} | 
                            <strong> Genre:</strong> {candidat.genre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Dossiers:</strong> {candidat.dossiers?.length || 0}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < candidats.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Aucun candidat trouvé</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Formations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            📚 Formations ({formations.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {formations.length > 0 ? (
            <List>
              {formations.map((formation, index) => (
                <React.Fragment key={formation.id}>
                  <ListItem>
                    <ListItemText
                      primary={formation.type_permis.libelle}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>ID:</strong> {formation.id} | 
                            <strong> Montant:</strong> {formation.montant_formate} | 
                            <strong> Session:</strong> {formation.session.libelle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Description:</strong> {formation.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Statut:</strong> 
                            <Chip 
                              label={formation.statut_libelle} 
                              color={formation.statut ? 'success' : 'error'} 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < formations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Aucune formation trouvée</Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DebugInfo;
