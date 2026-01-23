import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import GestionDossierTable from '../tables/GestionDossierTable';
import { gestionDossierService, typeDemandeService } from '../services';
import { TypeDemande } from '../types/type-demande';

interface TypeDemandeStats {
  typeDemande: TypeDemande;
  count: number;
}

const GestionDossierPage: React.FC = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);
  const [typeDemandeStats, setTypeDemandeStats] = useState<TypeDemandeStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const handleCreateDossier = () => {
    // Naviguer vers la première étape de création de dossier
    navigate('/gestion-dossier/create/0');
  };

  // Charger les statistiques par type de demande
  const loadStats = async () => {
    setLoadingStats(true);
    try {
      // Charger tous les types de demande
      const typeDemandesResponse = await typeDemandeService.getTypeDemandes(1, 100);
      const typeDemandes = typeDemandesResponse.data;

      // Charger tous les dossiers pour compter
      const dossiersResponse = await gestionDossierService.getDossiers(1, 1000);
      const allDossiers = dossiersResponse.data;

      // Compter les dossiers par type de demande
      const stats: TypeDemandeStats[] = typeDemandes.map((typeDemande) => {
        const count = allDossiers.filter((dossier) => {
          return dossier.type_demande_id === typeDemande.id;
        }).length;

        return {
          typeDemande,
          count,
        };
      });

      // Trier par nombre de dossiers (décroissant)
      stats.sort((a, b) => b.count - a.count);
      setTypeDemandeStats(stats);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const handleTypeDemandeClick = (typeDemandeId: string) => {
    // Passer le filtre au composant table via un callback ou un prop
    // Pour l'instant, on peut utiliser un state partagé ou un callback
    // Cette fonctionnalité nécessitera une modification de GestionDossierTable
    // pour accepter un prop de filtre initial
    console.log('Filtrer par type de demande:', typeDemandeId);
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', width: '100%', height: '100%' }}>
      {/* Contenu principal - occupe toute la largeur disponible */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 3, py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Gestion de Dossier
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez tous les dossiers des candidats, consultez leur statut et effectuez les actions nécessaires
            </Typography>
            <br />
            <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateDossier}
            sx={{ ml: 0, mt: 2 }}
          >
            Créer un nouveau dossier
          </Button>
          </Box>
         
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <GestionDossierTable refreshTrigger={refreshTrigger} />
          </Box>

          {/* Sidebar droite avec les statistiques */}
          <Paper
            sx={{
              width: 320,
              minWidth: 320,
              position: 'sticky',
              top: 20,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              borderLeft: 0,
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              p: 2,
            }}
            elevation={0}
          >
        

        {loadingStats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {typeDemandeStats.map((stat) => (
              <Card
                key={stat.typeDemande.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
                onClick={() => handleTypeDemandeClick(stat.typeDemande.id)}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {stat.typeDemande.name}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stat.count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.count === 1 ? 'dossier' : 'dossiers'}
                  </Typography>
                </CardContent>
              </Card>
            ))}

            {typeDemandeStats.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Aucune statistique disponible
              </Typography>
            )}
          </Box>
        )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default GestionDossierPage;

