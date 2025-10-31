import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  TextField, 
  Box,
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
// Heroicons imports
import { 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import ValidationService, { EleveValide } from '../services/validationService';
import EleveDetailsSheet from '../components/EleveDetailsSheet';

const StudentsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [elevesValides, setElevesValides] = useState<EleveValide[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistiques, setStatistiques] = useState<any>(null);
  const [selectedEleve, setSelectedEleve] = useState<EleveValide | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Charger les élèves validés au montage du composant
  useEffect(() => {
    chargerElevesValides();
    
    // Écouter les événements de validation de dossier pour rafraîchir automatiquement
    const handleDossierValidated = () => {
      console.log('🔄 Événement de validation reçu, rafraîchissement de la liste des élèves validés...');
      chargerElevesValides();
    };
    
    // Écouter aussi quand la page redevient visible (au cas où l'utilisateur navigue vers cette page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page devenue visible, rafraîchissement de la liste des élèves validés...');
        chargerElevesValides();
      }
    };
    
    window.addEventListener('dossierValidated', handleDossierValidated);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('dossierValidated', handleDossierValidated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const chargerElevesValides = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des élèves validés...');
      const eleves = await ValidationService.getElevesValides();
      console.log('📊 Élèves validés récupérés:', eleves.length);
      console.log('📋 Liste des élèves:', eleves);
      const stats = await ValidationService.getStatistiquesElevesValides();
      console.log('📊 Statistiques:', stats);
      setElevesValides(eleves);
      setStatistiques(stats);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des élèves validés:', error);
      console.error('📋 Détails de l\'erreur:', {
        message: error?.message,
        stack: error?.stack
      });
      setElevesValides([]);
      setStatistiques(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = elevesValides.filter(eleve => {
    const firstName = eleve.firstName?.toLowerCase() || '';
    const lastName = eleve.lastName?.toLowerCase() || '';
    const email = eleve.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return firstName.includes(search) || 
           lastName.includes(search) || 
           email.includes(search);
  });

  // Log pour débogage
  useEffect(() => {
    console.log('🔍 État de StudentsTable:');
    console.log('  - Élèves validés:', elevesValides.length);
    console.log('  - Élèves filtrés:', filteredStudents.length);
    console.log('  - Terme de recherche:', searchTerm);
    console.log('  - Données:', elevesValides);
  }, [elevesValides, filteredStudents, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validé';
      default: return 'Inconnu';
    }
  };

  const handleViewStudent = (studentId: string) => {
    const eleve = elevesValides.find(e => e.id === studentId);
    if (eleve) {
      setSelectedEleve(eleve);
      setSheetOpen(true);
    }
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedEleve(null);
  };

  const handleEditStudent = (studentId: string) => {
    console.log('Modifier élève:', studentId);
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await ValidationService.supprimerEleveValide(studentId);
      await chargerElevesValides(); // Recharger la liste
      console.log('Élève supprimé:', studentId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des élèves validés...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total validés
                </Typography>
                <Typography variant="h4">
                  {statistiques.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Documents complets
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistiques.documentsComplets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Documents incomplets
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistiques.documentsIncomplets}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Taux de complétude
                </Typography>
                <Typography variant="h4" color="info.main">
                  {statistiques.total > 0 ? Math.round((statistiques.documentsComplets / statistiques.total) * 100) : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box className="mb-4 flex gap-4 items-center">
        <TextField
          label="Rechercher un élève"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <MagnifyingGlassIcon className="w-5 h-5 mr-2 text-gray-400" />
          }}
          className="flex-1"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Auto-École</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Date de validation</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Chargement...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {elevesValides.length === 0 
                      ? 'Aucun élève validé trouvé. Les dossiers avec statut "valide" apparaîtront ici.' 
                      : `Aucun élève ne correspond à "${searchTerm}"`}
                  </Typography>
                  {elevesValides.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Vérifiez la console pour voir les détails de la récupération des données.
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((eleve) => (
                <TableRow key={eleve.id}>
                  <TableCell>{eleve.firstName} {eleve.lastName}</TableCell>
                  <TableCell>{eleve.email}</TableCell>
                  <TableCell>{eleve.phone}</TableCell>
                  <TableCell>{eleve.autoEcole.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(eleve.status)}
                      color={getStatusColor(eleve.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${eleve.documentsCount}/4`}
                      color={eleve.documentsCount === 4 ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(eleve.validatedAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Box className="flex gap-1">
                      <IconButton
                        size="small"
                        onClick={() => handleViewStudent(eleve.id)}
                        title="Voir détails"
                      >
                        <EyeIcon className="w-5 h-5 text-blue-600" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditStudent(eleve.id)}
                        title="Modifier"
                      >
                        <PencilIcon className="w-5 h-5 text-gray-600" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteStudent(eleve.id)}
                        title="Supprimer"
                      >
                        <TrashIcon className="w-5 h-5 text-red-600" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Right Sheet pour les détails */}
      <EleveDetailsSheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        eleve={selectedEleve}
      />
    </Box>
  );
};

export default StudentsTable;
