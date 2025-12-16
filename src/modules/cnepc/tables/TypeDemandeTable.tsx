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
} from '@mui/icons-material';
import { TypeDemande, TypeDemandeListResponse } from '../types/type-demande';
import { typeDemandeService } from '../services/type-demande.service';
import TypeDemandeForm from '../forms/TypeDemandeForm';

interface TypeDemandeTableProps {
  refreshTrigger?: number;
}

const TypeDemandeTable: React.FC<TypeDemandeTableProps> = ({ refreshTrigger }) => {
  const [typeDemandes, setTypeDemandes] = useState<TypeDemande[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les modales
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTypeDemande, setSelectedTypeDemande] = useState<TypeDemande | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeDemandeToDelete, setTypeDemandeToDelete] = useState<TypeDemande | null>(null);

  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Charger les types de demande
  const loadTypeDemandes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: TypeDemandeListResponse = await typeDemandeService.getTypeDemandes(
        page + 1,
        rowsPerPage,
        { search: searchTerm }
      );

      setTypeDemandes(response.data);
      setTotal(response.meta.total);
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de demande:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des types de demande');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données
  useEffect(() => {
    loadTypeDemandes();
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
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, typeDemandeId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(typeDemandeId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Actions du menu
  const handleEdit = () => {
    const typeDemande = typeDemandes.find((td) => td.id === selectedRowId);
    if (typeDemande) {
      setSelectedTypeDemande(typeDemande);
      setFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const typeDemande = typeDemandes.find((td) => td.id === selectedRowId);
    if (typeDemande) {
      setTypeDemandeToDelete(typeDemande);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!typeDemandeToDelete) return;

    try {
      await typeDemandeService.deleteTypeDemande(typeDemandeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeDemandeToDelete(null);
      loadTypeDemandes();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Gestion du formulaire
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedTypeDemande(undefined);
    loadTypeDemandes();
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setSelectedTypeDemande(undefined);
  };

  const handleAddNew = () => {
    setSelectedTypeDemande(undefined);
    setFormOpen(true);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Types de demande</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
            Ajouter
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un type de demande..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : typeDemandes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun type de demande trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                typeDemandes.map((typeDemande) => (
                  <TableRow key={typeDemande.id} hover>
                    <TableCell>{typeDemande.name}</TableCell>
                    <TableCell>
                      {new Date(typeDemande.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, typeDemande.id)}
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
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
          labelRowsPerPage="Lignes par page:"
        />
      </Paper>

      {/* Menu contextuel */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Formulaire */}
      <TypeDemandeForm
        typeDemande={selectedTypeDemande}
        open={formOpen}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le type de demande "{typeDemandeToDelete?.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TypeDemandeTable;

