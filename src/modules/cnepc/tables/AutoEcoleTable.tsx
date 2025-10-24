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
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  School,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { AutoEcole, AutoEcoleListResponse, autoEcoleService } from '../services';
import { AutoEcoleForm } from '../forms';

interface AutoEcoleTableProps {
  onAutoEcoleSelect?: (autoEcole: AutoEcole) => void;
  refreshTrigger?: number;
}

const AutoEcoleTable: React.FC<AutoEcoleTableProps> = ({
  onAutoEcoleSelect,
  refreshTrigger,
}) => {
  const [autoEcoles, setAutoEcoles] = useState<AutoEcole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les modales
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAutoEcole, setSelectedAutoEcole] = useState<AutoEcole | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [autoEcoleToDelete, setAutoEcoleToDelete] = useState<AutoEcole | null>(null);
  
  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Charger les auto-écoles
  const loadAutoEcoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AutoEcoleListResponse = await autoEcoleService.getAutoEcoles(
        page + 1,
        rowsPerPage,
        { search: searchTerm }
      );
      
      setAutoEcoles(response.data);
      setTotal(response.meta.total);
    } catch (err: any) {
      console.error('Erreur lors du chargement des auto-écoles:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des auto-écoles');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données
  useEffect(() => {
    loadAutoEcoles();
  }, [page, rowsPerPage, searchTerm, refreshTrigger]);

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion de la recherche
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Gestion du menu contextuel
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, autoEcoleId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(autoEcoleId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Actions du menu
  const handleEdit = () => {
    const autoEcole = autoEcoles.find(ae => ae.id === selectedRowId);
    if (autoEcole) {
      setSelectedAutoEcole(autoEcole);
      setFormOpen(true);
    }
    handleMenuClose();
  };

  const handleView = () => {
    const autoEcole = autoEcoles.find(ae => ae.id === selectedRowId);
    if (autoEcole && onAutoEcoleSelect) {
      onAutoEcoleSelect(autoEcole);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const autoEcole = autoEcoles.find(ae => ae.id === selectedRowId);
    if (autoEcole) {
      setAutoEcoleToDelete(autoEcole);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  // Gestion des formulaires
  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedAutoEcole(undefined);
  };

  const handleFormSuccess = (autoEcole: AutoEcole) => {
    loadAutoEcoles();
    handleFormClose();
  };

  // Gestion de la suppression
  const handleDeleteConfirm = async () => {
    if (!autoEcoleToDelete) return;

    try {
      await autoEcoleService.deleteAutoEcole(autoEcoleToDelete.id);
      loadAutoEcoles();
      setDeleteDialogOpen(false);
      setAutoEcoleToDelete(null);
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAutoEcoleToDelete(null);
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Box>
      {/* En-tête avec recherche et bouton d'ajout */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Gestion des Auto-Écoles
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setFormOpen(true)}
        >
          Nouvelle Auto-École
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une auto-école..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
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
                <TableCell>Nom</TableCell>
                <TableCell>Responsable</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : autoEcoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucune auto-école trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                autoEcoles.map((autoEcole) => (
                  <TableRow key={autoEcole.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School color="primary" />
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {autoEcole.nom_auto_ecole}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {autoEcole.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" />
                        <Box>
                          <Typography variant="body2">
                            {autoEcole.responsable.prenom} {autoEcole.responsable.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {autoEcole.responsable.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone color="action" />
                        <Typography variant="body2">{autoEcole.contact}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn color="action" />
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {autoEcole.adresse}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={autoEcole.statut_libelle}
                        color={autoEcole.statut ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(autoEcole.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, autoEcole.id)}
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

        <TablePagination
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
        />
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
          <ListItemText>Voir</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Formulaire d'auto-école */}
      <AutoEcoleForm
        autoEcole={selectedAutoEcole}
        onSuccess={handleFormSuccess}
        onCancel={handleFormClose}
        open={formOpen}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'auto-école "{autoEcoleToDelete?.nom_auto_ecole}" ?
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

export default AutoEcoleTable;
