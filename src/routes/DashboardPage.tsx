import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  UserGroupIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import tokenService from '../modules/auth/services/tokenService';
import { autoEcoleService } from '../modules/cnepc/services/auto-ecole.service';
import { getAutoEcoleId } from '../shared/utils/autoEcoleUtils';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalEleves: 0,
    dossiersValides: 0,
    transmisCNEPC: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState();

  useEffect(() => {
    const chargerStatistiques = async () => {
      try {
        setLoading(true);
        const autoEcoleId = getAutoEcoleId();

        if (!autoEcoleId) {
          console.warn('⚠️ Aucun ID d\'auto-école trouvé pour charger les statistiques');
          setStats({
            totalEleves: 0,
            dossiersValides: 0,
            transmisCNEPC: 0
          });
          setLoading(false);
          return;
        }

        // Charger tous les dossiers pour calculer les statistiques
        const response = await autoEcoleService.getDossiersByAutoEcoleId(autoEcoleId);
        const dossiers = response.dossiers || [];

        // 1. Total Élèves : nombre total de dossiers (tous statuts confondus)
        const totalEleves = dossiers.length;

        // 2. Dossiers Validés : dossiers avec statut "valide" ou "validated"
        const dossiersValides = dossiers.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'valide' || statut === 'validated' || statut === 'validee';
        }).length;

        // 3. Transmis CNEPC : dossiers avec statut "transmis" ou "transmitted"
        const transmisCNEPC = dossiers.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'transmis' || statut === 'transmitted';
        }).length;

        setStats({
          totalEleves,
          dossiersValides,
          transmisCNEPC
        });

        console.log('📊 Statistiques du dashboard chargées:', {
          totalEleves,
          dossiersValides,
          transmisCNEPC
        });
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        setStats({
          totalEleves: 0,
          dossiersValides: 0,
          transmisCNEPC: 0
        });
      } finally {
        setLoading(false);
      }
    };

    chargerStatistiques();
    setUser(tokenService.getUser());
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ p: 3 }}>
        {/* Section principale - Vue d'ensemble */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48, flexShrink: 0 }}>
                  <ChartBarIcon className="w-6 h-6" />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Vue d'ensembles
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Statistiques générales de la plateforme
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Dernière mise à jour
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'semibold', color: 'text.primary' }}>
                  Maintenant
                </Typography>
              </Box>
            </Box>

            {/* Statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      {loading ? (
                        <CircularProgress size={24} sx={{ mb: 1 }} />
                      ) : (
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {stats.totalEleves}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Total Élèves
                      </Typography>
                    </Box>
                    <UserGroupIcon className="w-8 h-8 text-gray-500" />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      {loading ? (
                        <CircularProgress size={24} sx={{ mb: 1 }} />
                      ) : (
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {stats.dossiersValides}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Dossiers Validés
                      </Typography>
                    </Box>
                    <CheckCircleIcon className="w-8 h-8 text-gray-500" />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      {loading ? (
                        <CircularProgress size={24} sx={{ mb: 1 }} />
                      ) : (
                        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {stats.transmisCNEPC}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Transmis CNEPC
                      </Typography>
                    </Box>
                    <PaperAirplaneIcon className="w-8 h-8 text-gray-500" />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;