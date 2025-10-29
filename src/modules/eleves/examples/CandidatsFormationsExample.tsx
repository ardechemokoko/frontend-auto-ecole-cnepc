import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import { candidatsService, CandidatApiItem } from '../services/candidats.service';
import { formationsService, FormationApiItem } from '../services/formations.service';
import { getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';

const CandidatsFormationsExample: React.FC = () => {
  const [candidats, setCandidats] = useState<CandidatApiItem[]>([]);
  const [formations, setFormations] = useState<FormationApiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCandidats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Aucun token d\'authentification trouvé');
        return;
      }

      const response = await candidatsService.getAllCandidats(token);
      setCandidats(response.data);
      console.log('✅ Candidats chargés:', response.data.length);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des candidats:', error);
      setError(`Erreur lors du chargement des candidats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Aucun token d\'authentification trouvé');
        return;
      }

      const autoEcoleId = getAutoEcoleId();
      if (!autoEcoleId) {
        setError('Aucune auto-école connectée trouvée');
        return;
      }

      const formationsData = await formationsService.getFormationsByAutoEcole(autoEcoleId, token);
      setFormations(formationsData);
      console.log('✅ Formations chargées:', formationsData.length);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des formations:', error);
      setError(`Erreur lors du chargement des formations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadCandidats(), loadFormations()]);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exemple d'utilisation des services Candidats et Formations
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={loadCandidats} 
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Charger les candidats
        </Button>
        <Button 
          variant="contained" 
          onClick={loadFormations} 
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Charger les formations
        </Button>
        <Button 
          variant="outlined" 
          onClick={loadAllData} 
          disabled={loading}
        >
          Charger tout
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Candidats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                👥 Candidats ({candidats.length})
              </Typography>
              
              {candidats.length > 0 ? (
                <List>
                  {candidats.slice(0, 5).map((candidat, index) => (
                    <React.Fragment key={candidat.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${candidat.personne.prenom} ${candidat.personne.nom}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Numéro:</strong> {candidat.numero_candidat}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Email:</strong> {candidat.personne.email}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Contact:</strong> {candidat.personne.contact}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Nationalité:</strong> {candidat.nationalite} | 
                                <strong> Genre:</strong> {candidat.genre}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Dossiers:</strong> {candidat.dossiers?.length || 0}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(candidats.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {candidats.length > 5 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        ... et {candidats.length - 5} autres candidats
                      </Typography>
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucun candidat chargé. Cliquez sur "Charger les candidats" pour commencer.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Formations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📚 Formations ({formations.length})
              </Typography>
              
              {formations.length > 0 ? (
                <List>
                  {formations.slice(0, 5).map((formation, index) => (
                    <React.Fragment key={formation.id}>
                      <ListItem>
                        <ListItemText
                          primary={formation.type_permis.libelle}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Montant:</strong> {formation.montant_formate}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Session:</strong> {formation.session.libelle}
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
                      {index < Math.min(formations.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {formations.length > 5 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        ... et {formations.length - 5} autres formations
                      </Typography>
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucune formation chargée. Cliquez sur "Charger les formations" pour commencer.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Informations de débogage */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Informations de débogage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Token présent:</strong> {localStorage.getItem('access_token') ? 'Oui' : 'Non'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Auto-école ID:</strong> {getAutoEcoleId() || 'Non trouvé'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>État de chargement:</strong> {loading ? 'En cours...' : 'Terminé'}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CandidatsFormationsExample;
