import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Paper,
} from '@mui/material';
import {
  People as UserGroupIcon,
  CheckCircle as CheckCircleIcon,
  Send as PaperAirplaneIcon,
  BarChart as ChartBarIcon,
} from '@mui/icons-material';
import tokenService from '../modules/auth/services/tokenService';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalEleves: 0,
    dossiersValides: 0,
    transmisCNEPC: 0
  });
const [user, setUser]= useState();
  useEffect(() => {
    // Simuler le chargement des statistiques
    setStats({
      totalEleves: 156,
      dossiersValides: 89,
      transmisCNEPC: 23
    });
    setUser(tokenService.getUser())
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
                  <ChartBarIcon />
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
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {stats.totalEleves}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Élèves
                      </Typography>
                    </Box>
                    <UserGroupIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {stats.dossiersValides}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dossiers Validés
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} lg={3}>
                <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        {stats.transmisCNEPC}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Transmis CNEPC
                      </Typography>
                    </Box>
                    <PaperAirplaneIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
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