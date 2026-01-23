import React, { useState } from 'react';
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
  Card,
  CardContent,
  Pagination,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Delete,
  Edit,
  Visibility,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useUsers } from '../hooks';
import { User } from '../types';
import { userService } from '../services';
import { UserForm } from '../forms';
import { useNavigate } from 'react-router-dom';

interface UsersTableProps {
  refreshTrigger?: number;
}

const UsersTable: React.FC<UsersTableProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const { users, loading, error, pagination, stats, refresh, setPage } = useUsers({
    filters: {
      search: searchTerm || undefined,
      role: roleFilter || undefined,
    },
  });

  // Rafraîchir quand refreshTrigger change
  React.useEffect(() => {
    if (refreshTrigger !== undefined) {
      refresh();
    }
  }, [refreshTrigger]);

  // Filtrer les utilisateurs par terme de recherche
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.personne?.nom.toLowerCase().includes(searchLower) ||
      user.personne?.prenom.toLowerCase().includes(searchLower) ||
      user.personne?.contact.toLowerCase().includes(searchLower)
    );
  });

  // Gestion du menu contextuel
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Actions du menu
  const handleView = () => {
    const user = users.find(u => u.id === selectedRowId);
    if (user) {
      // Naviguer vers la page de détails
      navigate(`/candidat/${user.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    const user = users.find(u => u.id === selectedRowId);
    if (user) {
      setSelectedUser(user);
      setUserFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const user = users.find(u => u.id === selectedRowId);
    if (user) {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  // Gestion des formulaires
  const handleUserFormClose = () => {
    setUserFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleFormSuccess = () => {
    refresh();
    handleUserFormClose();
  };

  // Gestion de la suppression
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await userService.deleteUser(userToDelete.id);
      refresh();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Obtenir la couleur du rôle
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'error';
      case 'ROLE_AUTO_ECOLE': return 'primary';
      case 'ROLE_CNEPC': return 'info';
      case 'ROLE_CNEDDT': return 'warning';
      case 'candidat': return 'success';
      default: return 'default';
    }
  };

  // Obtenir le libellé du rôle
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'Administrateur';
      case 'ROLE_AUTO_ECOLE': return 'Auto-École';
      case 'ROLE_CNEPC': return 'CNEPC';
      case 'ROLE_CNEDDT': return 'CNEDDT';
      case 'candidat': return 'Candidat';
      default: return role;
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Gestion des Utilisateurs
        </Typography>
      </Box>

      {/* Statistiques */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {Object.entries(stats.by_role || {}).map(([role, count]) => (
            <Grid item xs={12} sm={6} md={3} key={role}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="overline" color="text.secondary">
                    {getRoleLabel(role)}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Barres de recherche et filtres */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par rôle</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Filtrer par rôle"
          >
            <MenuItem value="">Tous les rôles</MenuItem>
            <MenuItem value="ROLE_ADMIN">Administrateur</MenuItem>
            <MenuItem value="ROLE_AUTO_ECOLE">Auto-École</MenuItem>
            <MenuItem value="ROLE_CNEPC">CNEPC</MenuItem>
            <MenuItem value="ROLE_CNEDDT">CNEDDT</MenuItem>
            <MenuItem value="candidat">Candidat</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedUser(undefined);
            setUserFormOpen(true);
          }}
        >
          Nouvel Utilisateur
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
                <TableCell>Utilisateur</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Aucun utilisateur trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {user.personne?.prenom?.[0] || user.email[0]}
                          {user.personne?.nom?.[0] || ''}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.personne ? `${user.personne.prenom} ${user.personne.nom}` : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {user.personne?.contact && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone fontSize="small" color="action" />
                            <Typography variant="body2">{user.personne.contact}</Typography>
                          </Box>
                        )}
                        {user.personne?.adresse && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {user.personne.adresse}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(user.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user.id)}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={(_, page) => setPage(page)}
              color="primary"
            />
          </Box>
        )}
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

      {/* Formulaire utilisateur */}
      <UserForm
        user={selectedUser}
        onSuccess={handleFormSuccess}
        onCancel={handleUserFormClose}
        open={userFormOpen}
      />

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.email}</strong> ?
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

export default UsersTable;

