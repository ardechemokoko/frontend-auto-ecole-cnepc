import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Person,
  Email,
  Phone,
  LocationOn,
  School,
  Assignment,
} from '@mui/icons-material';
import { Dossier, MesDossiersResponse, autoEcoleService } from '../services';
import { CandidatForm, DossierForm } from '../forms';

interface CandidatsTableProps {
  autoEcoleId?: string;
  refreshTrigger?: number;
}

const CandidatsTable: React.FC<CandidatsTableProps> = ({
  autoEcoleId,
  refreshTrigger,
}) => {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistiques, setStatistiques] = useState({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    valide: 0,
    rejete: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  
  // États pour les modales
  const [candidatFormOpen, setCandidatFormOpen] = useState(false);
  const [dossierFormOpen, setDossierFormOpen] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState<any>(undefined);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null);
  
  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Charger les dossiers (candidats inscrits)
  const loadDossiers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: MesDossiersResponse = await autoEcoleService.getMesDossiers({
        statut: statutFilter as any,
      });
      
      setDossiers(response.dossiers);
      setStatistiques(response.statistiques);
    } catch (err: any) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des candidats');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données
  useEffect(() => {
    loadDossiers();
  }, [statutFilter, refreshTrigger]);

  // Filtrer les dossiers par terme de recherche
  const filteredDossiers = dossiers.filter(dossier => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      dossier.candidat.personne.nom.toLowerCase().includes(searchLower) ||
      dossier.candidat.personne.prenom.toLowerCase().includes(searchLower) ||
      dossier.candidat.numero_candidat.toLowerCase().includes(searchLower) ||
      dossier.candidat.personne.email.toLowerCase().includes(searchLower)
    );
  });

  // Gestion de la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Gestion du filtre par statut
  const handleStatutFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatutFilter(event.target.value);
  };

  // Gestion du menu contextuel
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dossierId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(dossierId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Actions du menu
  const handleView = () => {
    const dossier = dossiers.find(d => d.id === selectedRowId);
    if (dossier) {
      // Logique pour voir les détails du dossier
      console.log('Voir dossier:', dossier);
    }
    handleMenuClose();
  };

  const handleEditDossier = () => {
    const dossier = dossiers.find(d => d.id === selectedRowId);
    if (dossier) {
      setSelectedDossier(dossier);
      setDossierFormOpen(true);
    }
    handleMenuClose();
  };

  const handleEditCandidat = () => {
    const dossier = dossiers.find(d => d.id === selectedRowId);
    if (dossier) {
      setSelectedCandidat(dossier.candidat);
      setCandidatFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const dossier = dossiers.find(d => d.id === selectedRowId);
    if (dossier) {
      setDossierToDelete(dossier);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  // Gestion des formulaires
  const handleCandidatFormClose = () => {
    setCandidatFormOpen(false);
    setSelectedCandidat(undefined);
  };

  const handleDossierFormClose = () => {
    setDossierFormOpen(false);
    setSelectedDossier(undefined);
  };

  const handleFormSuccess = () => {
    loadDossiers();
    handleCandidatFormClose();
    handleDossierFormClose();
  };

  // Gestion de la suppression
  const handleDeleteConfirm = async () => {
    if (!dossierToDelete) return;

    try {
      // Note: Il n'y a pas de méthode deleteDossier dans le service actuel
      // await autoEcoleService.deleteDossier(dossierToDelete.id);
      console.log('Suppression du dossier:', dossierToDelete.id);
      loadDossiers();
      setDeleteDialogOpen(false);
      setDossierToDelete(null);
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDossierToDelete(null);
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Obtenir la couleur du statut
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'en_cours': return 'info';
      case 'valide': return 'success';
      case 'rejete': return 'error';
      default: return 'default';
    }
  };

  // Obtenir le libellé du statut
  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valide': return 'Validé';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  };

  return (
    <Box>
      {/* En-tête avec statistiques */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Candidats Inscrits
        </Typography>
        
        {/* Statistiques */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {statistiques.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {statistiques.en_attente}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En attente
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="info.main">
                {statistiques.en_cours}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                En cours
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {statistiques.valide}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Validés
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {statistiques.rejete}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejetés
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Barres de recherche et filtres */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher un candidat..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <TextField
          select
          label="Filtrer par statut"
          value={statutFilter}
          onChange={handleStatutFilterChange}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Tous les statuts</MenuItem>
          <MenuItem value="en_attente">En attente</MenuItem>
          <MenuItem value="en_cours">En cours</MenuItem>
          <MenuItem value="valide">Validé</MenuItem>
          <MenuItem value="rejete">Rejeté</MenuItem>
        </TextField>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCandidatFormOpen(true)}
        >
          Nouveau Candidat
        </Button>
      </Box>

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidat</TableCell>
                <TableCell>Formation</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Date d'inscription</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredDossiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucun candidat trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDossiers.map((dossier) => (
                  <TableRow key={dossier.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {dossier.candidat.personne.prenom[0]}{dossier.candidat.personne.nom[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {dossier.candidat.personne.prenom} {dossier.candidat.personne.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dossier.candidat.numero_candidat}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Email fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {dossier.candidat.personne.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {dossier.formation.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dossier.formation.prix}€ - {dossier.formation.duree_jours} jours
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatutLabel(dossier.statut)}
                        color={getStatutColor(dossier.statut) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment color="action" />
                        <Typography variant="body2">
                          {dossier.documents.length} document(s)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(dossier.date_creation)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, dossier.id)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir détails</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditCandidat}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier candidat</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditDossier}>
          <ListItemIcon>
            <Assignment fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier dossier</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Formulaire de candidat */}
      <CandidatForm
        candidat={selectedCandidat}
        onSuccess={handleFormSuccess}
        onCancel={handleCandidatFormClose}
        open={candidatFormOpen}
      />

      {/* Formulaire de dossier */}
      <DossierForm
        dossier={selectedDossier}
        onSuccess={handleFormSuccess}
        onCancel={handleDossierFormClose}
        open={dossierFormOpen}
        autoEcoleId={autoEcoleId}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le dossier de candidature ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidatsTable;
