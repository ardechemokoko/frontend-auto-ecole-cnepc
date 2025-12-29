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
  ChartBarIcon,
  AcademicCapIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { autoEcoleService } from '../modules/cnepc/services/auto-ecole.service';
import { getAutoEcoleId } from '../shared/utils/autoEcoleUtils';
import { useAppStore } from '../store';
import axiosClient from '../shared/environment/envdev';

const DashboardPage: React.FC = () => {
  const { user } = useAppStore();
  const [stats, setStats] = useState({
    totalEleves: 0,
    dossiersValides: 0,
    transmisCNEPC: 0
  });
  const [adminStats, setAdminStats] = useState({
    totalAutoEcoles: 0,
    autoEcolesActives: 0,
    autoEcolesInactives: 0
  });
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);

  // Charger les statistiques pour les admins
  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      const chargerStatistiquesAdmin = async () => {
        try {
          setAdminLoading(true);
          
          console.log('🔄 Chargement des statistiques admin...');
          
          // Récupérer les auto-écoles directement depuis l'endpoint /auto-ecoles
          const response = await axiosClient.get('/auto-ecoles');
          
          console.log('📦 Réponse complète de /auto-ecoles:', response);
          console.log('📦 response.data:', response.data);
          console.log('📦 response.data.data:', response.data?.data);
          console.log('📦 response.data.meta:', response.data?.meta);
          
          // La réponse a la structure: { data: [...], links: {...}, meta: {...} }
          let autoEcoles: any[] = [];
          if (response.data?.data && Array.isArray(response.data.data)) {
            autoEcoles = response.data.data;
            console.log('✅ Auto-écoles trouvées dans response.data.data:', autoEcoles.length);
          } else if (response.data?.success && response.data?.data) {
            autoEcoles = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            console.log('✅ Auto-écoles trouvées dans response.data.success.data:', autoEcoles.length);
          } else if (Array.isArray(response.data)) {
            autoEcoles = response.data;
            console.log('✅ Auto-écoles trouvées dans response.data (array):', autoEcoles.length);
          } else {
            console.warn('⚠️ Aucune structure de données reconnue. Structure reçue:', {
              hasData: !!response.data,
              hasDataData: !!response.data?.data,
              isArray: Array.isArray(response.data),
              keys: response.data ? Object.keys(response.data) : []
            });
          }

          console.log('📋 Auto-écoles extraites:', autoEcoles);
          console.log('📋 Nombre d\'auto-écoles:', autoEcoles.length);

          const totalAutoEcoles = autoEcoles.length;
          const autoEcolesActives = autoEcoles.filter((ae: any) => {
            // Gérer le cas où statut est un booléen
            if (typeof ae.statut === 'boolean') {
              const isActive = ae.statut === true;
              console.log(`🔍 Auto-école ${ae.id}: statut (boolean)=${ae.statut}, isActive=${isActive}`);
              return isActive;
            }
            
            // Gérer le cas où statut est un nombre
            if (typeof ae.statut === 'number') {
              const isActive = ae.statut === 1;
              console.log(`🔍 Auto-école ${ae.id}: statut (number)=${ae.statut}, isActive=${isActive}`);
              return isActive;
            }
            
            // Gérer le cas où statut est une chaîne de caractères
            const statut = typeof ae.statut === 'string' ? ae.statut.toLowerCase() : '';
            const statutLibelle = typeof ae.statut_libelle === 'string' ? ae.statut_libelle.toLowerCase() : '';
            const isActive = statut === 'actif' || statut === 'active' || statut === 'activé' || 
                           statutLibelle === 'actif' || statutLibelle === 'active' || statutLibelle === 'activé' ||
                           ae.statut === true || ae.statut === 1;
            console.log(`🔍 Auto-école ${ae.id}: statut="${ae.statut}", statut_libelle="${ae.statut_libelle}", isActive=${isActive}`);
            return isActive;
          }).length;
          const autoEcolesInactives = totalAutoEcoles - autoEcolesActives;

          console.log('📊 Calcul des statistiques:', {
            totalAutoEcoles,
            autoEcolesActives,
            autoEcolesInactives
          });

          setAdminStats({
            totalAutoEcoles,
            autoEcolesActives,
            autoEcolesInactives
          });

          console.log('✅ Statistiques admin mises à jour:', {
            totalAutoEcoles,
            autoEcolesActives,
            autoEcolesInactives,
            meta: response.data?.meta
          });
        } catch (error: any) {
          console.error('❌ Erreur lors du chargement des statistiques admin:', error);
          console.error('❌ Détails de l\'erreur:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          setAdminStats({
            totalAutoEcoles: 0,
            autoEcolesActives: 0,
            autoEcolesInactives: 0
          });
        } finally {
          setAdminLoading(false);
        }
      };

      chargerStatistiquesAdmin();
      return;
    }
  }, [user]);

  // Charger les statistiques pour les responsables auto-école
  useEffect(() => {
    if (user?.role !== 'ROLE_ADMIN') {
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

      // Écouter les événements de mise à jour des dossiers
      const handleDossierUpdated = () => {
        console.log('🔄 Événement de mise à jour de dossier reçu, rafraîchissement des statistiques...');
        chargerStatistiques();
      };

      // Écouter les événements de validation de dossier
      const handleDossierValidated = () => {
        console.log('🔄 Événement de validation de dossier reçu, rafraîchissement des statistiques...');
        chargerStatistiques();
      };

      // Écouter les événements d'envoi au CNEPC
      const handleDossierTransmis = () => {
        console.log('🔄 Événement de transmission au CNEPC reçu, rafraîchissement des statistiques...');
        chargerStatistiques();
      };

      // Écouter quand la page redevient visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('🔄 Page devenue visible, rafraîchissement des statistiques...');
          chargerStatistiques();
        }
      };

      window.addEventListener('dossierUpdated', handleDossierUpdated);
      window.addEventListener('dossierValidated', handleDossierValidated);
      window.addEventListener('dossierTransmis', handleDossierTransmis);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Nettoyer les écouteurs lors du démontage
      return () => {
        window.removeEventListener('dossierUpdated', handleDossierUpdated);
        window.removeEventListener('dossierValidated', handleDossierValidated);
        window.removeEventListener('dossierTransmis', handleDossierTransmis);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);

  // Dashboard pour les admins
  if (user?.role === 'ROLE_ADMIN') {
    console.log('👤 Utilisateur admin détecté, affichage du dashboard admin');
    console.log('📊 État actuel des statistiques admin:', adminStats);
    console.log('⏳ État du chargement:', adminLoading);
    
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ p: 3 }}>
          {/* Section principale - Vue d'ensemble Admin */}
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
                      Vue d'ensemble - Administration
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
                      Statistiques générales sur les auto-écoles
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

              {/* Statistiques principales pour Admin */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} lg={4}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        {adminLoading ? (
                          <CircularProgress size={24} sx={{ mb: 1 }} />
                        ) : (
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {adminStats.totalAutoEcoles}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Total Auto-Écoles
                        </Typography>
                      </Box>
                      <AcademicCapIcon className="w-8 h-8 text-gray-500" />
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        {adminLoading ? (
                          <CircularProgress size={24} sx={{ mb: 1 }} />
                        ) : (
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {adminStats.autoEcolesActives}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Auto-Écoles Actives
                        </Typography>
                      </Box>
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} lg={4}>
                  <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        {adminLoading ? (
                          <CircularProgress size={24} sx={{ mb: 1 }} />
                        ) : (
                          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {adminStats.autoEcolesInactives}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Auto-Écoles Inactives
                        </Typography>
                      </Box>
                      <XCircleIcon className="w-8 h-8 text-red-500" />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  }

  // Dashboard pour les responsables auto-école
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