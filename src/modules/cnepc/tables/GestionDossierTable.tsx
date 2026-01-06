import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { Dossier, Referentiel } from '../types/auto-ecole';
import { gestionDossierService, referentielService } from '../services';
import { GestionDossierFilters, GestionDossierListResponse } from '../types/gestion-dossier';
import { DossierForm } from '../forms';

interface GestionDossierTableProps {
  refreshTrigger?: number;
}

const GestionDossierTable: React.FC<GestionDossierTableProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');

  // États pour les modales
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null);

  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Cache pour les référentiels chargés
  const [referentielsCache, setReferentielsCache] = useState<Map<string, Referentiel>>(new Map());

  // Charger un référentiel par son ID
  const loadReferentiel = async (id: string): Promise<Referentiel | null> => {
    // Vérifier le cache d'abord
    if (referentielsCache.has(id)) {
      return referentielsCache.get(id)!;
    }

    try {
      const referentiel = await referentielService.getReferentielById(id);
      // Mettre en cache
      setReferentielsCache((prev) => new Map(prev).set(id, referentiel));
      return referentiel;
    } catch (err: any) {
      console.error(`Erreur lors du chargement du référentiel ${id}:`, err);
      return null;
    }
  };

  // Charger les référentiels manquants pour les dossiers
  const loadMissingReferentiels = async (dossiers: Dossier[]) => {
    const referentielIds = new Set<string>();
    
    // Collecter tous les referenciel_id uniques
    dossiers.forEach((dossier) => {
      const referencielId = (dossier as any).referenciel_id;
      if (referencielId && !referentielsCache.has(referencielId)) {
        referentielIds.add(referencielId);
      }
    });

    // Charger tous les référentiels manquants en parallèle
    if (referentielIds.size > 0) {
      const promises = Array.from(referentielIds).map((id) => loadReferentiel(id));
      await Promise.all(promises);
    }
  };

  // Charger les dossiers
  const loadDossiers = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: GestionDossierFilters = {
        search: searchTerm || undefined,
        statut: statutFilter ? (statutFilter as any) : undefined,
      };

      const response: GestionDossierListResponse = await gestionDossierService.getDossiers(
        page + 1,
        rowsPerPage,
        filters
      );

      setDossiers(response.data);
      setTotal(response.meta.total);

      // Charger les référentiels manquants
      await loadMissingReferentiels(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données
  useEffect(() => {
    loadDossiers();
  }, [page, rowsPerPage, searchTerm, statutFilter, refreshTrigger]);

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

  // Gestion du filtre de statut
  const handleStatutFilterChange = (event: any) => {
    setStatutFilter(event.target.value);
    setPage(0);
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
    const dossier = dossiers.find((d) => d.id === selectedRowId);
    if (dossier) {
      navigate(`/cnepc/dossiers/${dossier.id}`, { state: { dossier } });
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    const dossier = dossiers.find((d) => d.id === selectedRowId);
    if (dossier) {
      setSelectedDossier(dossier);
      setFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    const dossier = dossiers.find((d) => d.id === selectedRowId);
    if (dossier) {
      setDossierToDelete(dossier);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!dossierToDelete) return;

    try {
      await gestionDossierService.deleteDossier(dossierToDelete.id);
      setDeleteDialogOpen(false);
      setDossierToDelete(null);
      loadDossiers();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Gestion du formulaire
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedDossier(undefined);
    loadDossiers();
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setSelectedDossier(undefined);
  };

  // Fonction pour obtenir la couleur du statut
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'valide':
        return 'success';
      case 'en_cours':
        return 'info';
      case 'rejete':
        return 'error';
      case 'transmis':
      case 'Cnepc':
        return 'secondary';
      default:
        return 'warning';
    }
  };

  // Fonction pour formater le statut
  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      en_cours: 'En cours',
      valide: 'Validé',
      rejete: 'Rejeté',
      transmis: 'Transmis',
      Cnepc: 'CNEPC',
    };
    return labels[statut] || statut;
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Fonction pour vérifier si c'est un nouveau permis
  const checkIsNouveauPermis = (typeDemandeName: string | undefined): boolean => {
    if (!typeDemandeName) return false;
    const nameLower = typeDemandeName.toLowerCase();
    return nameLower.includes('nouveau permis') || 
           (nameLower.includes('nouveau') && nameLower.includes('permis')) ||
           nameLower === 'nouveau permis';
  };

  // Fonction pour obtenir le libellé du type de permis
  // Priorité : 1. referentiel du dossier (si présent), 2. formation.type_permis
  const getTypePermisLabel = (dossier: Dossier): string => {
    const referencielId = (dossier as any).referenciel_id;
    
    // 1. Vérifier d'abord le référentiel du dossier (pour tous les types de demande)
    // D'abord vérifier si l'objet est directement dans le dossier
    if (dossier.referentiel) {
      if (dossier.referentiel.libelle) {
        return dossier.referentiel.libelle;
      }
      if (dossier.referentiel.code) {
        return dossier.referentiel.code;
      }
    }
    
    // Ensuite vérifier le cache si on a seulement l'ID
    if (referencielId) {
      const cachedReferentiel = referentielsCache.get(referencielId);
      if (cachedReferentiel) {
        if (cachedReferentiel.libelle) {
          return cachedReferentiel.libelle;
        }
        if (cachedReferentiel.code) {
          return cachedReferentiel.code;
        }
      }
    }
    
    // 2. Si pas de référentiel, vérifier dans la formation (pour nouveau permis)
    const formation = dossier.formation;
    if (!formation) {
      return 'N/A';
    }
    
    // Vérifier type_permis (snake_case) - format principal selon l'API
    if (formation.type_permis) {
      if (typeof formation.type_permis === 'string') {
        return formation.type_permis;
      }
      // Type guard : vérifier si c'est un Referentiel (a libelle et code)
      if ('libelle' in formation.type_permis) {
        return formation.type_permis.libelle;
      }
      // Type guard : vérifier si c'est un TypePermis (a nom)
      if ('nom' in formation.type_permis) {
        return formation.type_permis.nom;
      }
    }
    
    // Vérifier typePermis (camelCase) - format alternatif
    if (formation.typePermis) {
      if (typeof formation.typePermis === 'string') {
        return formation.typePermis;
      }
      // Type guard : vérifier si c'est un Referentiel (a libelle et code)
      if ('libelle' in formation.typePermis) {
        return formation.typePermis.libelle;
      }
      // Type guard : vérifier si c'est un TypePermis (a nom)
      if ('nom' in formation.typePermis) {
        return formation.typePermis.nom;
      }
    }
    
    return 'N/A';
  };

  // Fonction pour obtenir le nom de l'auto-école
  const getAutoEcoleName = (dossier: Dossier): string => {
    // Vérifier d'abord dans formation.auto_ecole
    if (dossier.formation?.auto_ecole) {
      if (typeof dossier.formation.auto_ecole === 'string') {
        return dossier.formation.auto_ecole;
      }
      if (dossier.formation.auto_ecole.nom_auto_ecole) {
        return dossier.formation.auto_ecole.nom_auto_ecole;
      }
    }
    
    return 'N/A';
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Gestion des Dossiers</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher un dossier..."
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

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statutFilter}
              label="Statut"
              onChange={handleStatutFilterChange}
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="en_attente">En attente</MenuItem>
              <MenuItem value="en_cours">En cours</MenuItem>
              <MenuItem value="valide">Validé</MenuItem>
              <MenuItem value="rejete">Rejeté</MenuItem>
              <MenuItem value="transmis">Transmis</MenuItem>
              <MenuItem value="Cnepc">CNEPC</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numéro Candidat</TableCell>
                <TableCell>Candidat</TableCell>
                <TableCell>Type de Permis</TableCell>
                <TableCell>Type Demande</TableCell>
                <TableCell>Formation</TableCell>
                <TableCell>Auto-École</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date Création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : dossiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun dossier trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                dossiers.map((dossier) => {
                  const isNouveauPermis = checkIsNouveauPermis(dossier.type_demande?.name);
                  return (
                    <TableRow key={dossier.id} hover>
                      <TableCell>{dossier.candidat?.numero_candidat || 'N/A'}</TableCell>
                      <TableCell>
                        {dossier.candidat?.personne
                          ? `${dossier.candidat.personne.prenom} ${dossier.candidat.personne.nom}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{getTypePermisLabel(dossier)}</TableCell>
                      <TableCell>
                        {dossier.type_demande?.name || dossier.type_demande_id || 'N/A'}
                      </TableCell>
                      <TableCell>{dossier.formation?.nom || dossier.formation?.description || 'N/A'}</TableCell>
                      <TableCell>
                        {isNouveauPermis ? getAutoEcoleName(dossier) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatutLabel(dossier.statut)}
                          color={getStatutColor(dossier.statut) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(dossier.date_creation || dossier.created_at)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, dossier.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
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
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir les détails</ListItemText>
        </MenuItem>
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
      {selectedDossier && (
        <DossierForm
          dossier={selectedDossier}
          open={formOpen}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          autoEcoleId={selectedDossier.auto_ecole_id}
        />
      )}

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.
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

export default GestionDossierTable;


