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
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Alert,
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
  Card,
  CardContent,
  Grid,
  Stack,
  Collapse,
  Skeleton,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { Dossier, Referentiel } from '../types/auto-ecole';
import { TypeDemande } from '../types/type-demande';
import { gestionDossierService, referentielService, typeDemandeService } from '../services';
import { GestionDossierFilters, GestionDossierListResponse } from '../types/gestion-dossier';
import { DossierForm } from '../forms';
import { calculateDossierStatusFromCircuit } from '../utils/dossierStatus';

interface GestionDossierTableProps {
  refreshTrigger?: number;
}

const GestionDossierTable: React.FC<GestionDossierTableProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [allDossiers, setAllDossiers] = useState<Dossier[]>([]); // Tous les dossiers chargés (pour filtrage frontend)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [typeDemandeFilter, setTypeDemandeFilter] = useState<string>('');
  const [typePermisFilter, setTypePermisFilter] = useState<string>('');
  const [typeDemandes, setTypeDemandes] = useState<TypeDemande[]>([]);
  const [typePermis, setTypePermis] = useState<Referentiel[]>([]);
  
  // États locaux pour les filtres (comme dans FiltresPanel)
  const [localFilters, setLocalFilters] = useState({
    search: '',
    statut: '',
    type_demande_id: '',
    type_permis_id: '',
  });

  // États pour les modales
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null);

  // Menu contextuel
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  
  // État pour les lignes étendues
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Cache pour les référentiels chargés
  const [referentielsCache, setReferentielsCache] = useState<Map<string, Referentiel>>(new Map());
  
  // Cache pour les types de demande chargés
  const [typeDemandeCache, setTypeDemandeCache] = useState<Map<string, TypeDemande>>(new Map());
  
  // Cache pour les statuts calculés des dossiers
  const [dossierStatusCache, setDossierStatusCache] = useState<Map<string, string>>(new Map());

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

  // Charger un type de demande par son ID
  const loadTypeDemande = async (id: string): Promise<TypeDemande | null> => {
    // Vérifier le cache d'abord
    if (typeDemandeCache.has(id)) {
      return typeDemandeCache.get(id)!;
    }

    try {
      const typeDemande = await typeDemandeService.getTypeDemandeById(id);
      // Mettre en cache
      setTypeDemandeCache((prev) => new Map(prev).set(id, typeDemande));
      return typeDemande;
    } catch (err: any) {
      console.error(`Erreur lors du chargement du type de demande ${id}:`, err);
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
      const loadedReferentiels = await Promise.all(promises);
      
      // Mettre à jour le cache avec les référentiels chargés
      const newCache = new Map(referentielsCache);
      loadedReferentiels.forEach((referentiel) => {
        if (referentiel) {
          newCache.set(referentiel.id, referentiel);
        }
      });
      setReferentielsCache(newCache);
      
      // Mettre à jour les dossiers avec les référentiels chargés
      setDossiers((prevDossiers) => {
        return prevDossiers.map((dossier) => {
          const referencielId = (dossier as any).referenciel_id;
          if (referencielId && newCache.has(referencielId) && !dossier.referentiel) {
            return {
              ...dossier,
              referentiel: newCache.get(referencielId)!,
            };
          }
          return dossier;
        });
      });
    }
  };

  // Charger les types de demande manquants pour les dossiers
  const loadMissingTypeDemandes = async (dossiers: Dossier[]) => {
    const typeDemandeIds = new Set<string>();
    
    // Collecter tous les type_demande_id uniques
    dossiers.forEach((dossier) => {
      if (dossier.type_demande_id && !typeDemandeCache.has(dossier.type_demande_id)) {
        typeDemandeIds.add(dossier.type_demande_id);
      }
    });

    // Charger tous les types de demande manquants en parallèle
    if (typeDemandeIds.size > 0) {
      const promises = Array.from(typeDemandeIds).map((id) => loadTypeDemande(id));
      const loadedTypeDemandes = await Promise.all(promises);
      
      // Mettre à jour le cache avec les types de demande chargés
      const newCache = new Map(typeDemandeCache);
      loadedTypeDemandes.forEach((typeDemande) => {
        if (typeDemande) {
          newCache.set(typeDemande.id, typeDemande);
        }
      });
      setTypeDemandeCache(newCache);
      
      // Mettre à jour les dossiers avec les types de demande chargés
      setDossiers((prevDossiers) => {
        return prevDossiers.map((dossier) => {
          if (dossier.type_demande_id && newCache.has(dossier.type_demande_id) && !dossier.type_demande) {
            return {
              ...dossier,
              type_demande: newCache.get(dossier.type_demande_id)!,
            };
          }
          return dossier;
        });
      });
    }
  };

  // Charger tous les types de demande
  const loadTypeDemandes = async () => {
    try {
      const response = await typeDemandeService.getTypeDemandes(1, 100);
      setTypeDemandes(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de demande:', err);
    }
  };

  // Charger tous les types de permis
  const loadTypePermis = async () => {
    try {
      const referentiels = await referentielService.getReferentielsByType('type_permis');
      setTypePermis(referentiels);
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de permis:', err);
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
        // type_demande_id retiré - filtrage frontend uniquement
      };

      // Si on a un filtre par type de demande ou type de permis, charger tous les dossiers (grande limite)
      // Sinon, charger avec pagination normale
      const hasFrontendFilter = (typeDemandeFilter && typeDemandeFilter !== '') || (typePermisFilter && typePermisFilter !== '');
      const perPageToLoad = hasFrontendFilter ? 1000 : rowsPerPage;
      const pageToLoad = hasFrontendFilter ? 1 : page + 1;

      const response: GestionDossierListResponse = await gestionDossierService.getDossiers(
        pageToLoad,
        perPageToLoad,
        filters
      );

      // Stocker tous les dossiers chargés
      setAllDossiers(response.data);

      // Charger les référentiels manquants
      await loadMissingReferentiels(response.data);
      
      // Charger les types de demande manquants
      await loadMissingTypeDemandes(response.data);
      
      // Charger les circuits et calculer les statuts des dossiers
      const statusMap = new Map<string, string>();
      for (const d of response.data) {
        try {
          const typeDemande = d.type_demande || (d.type_demande_id ? typeDemandeCache.get(d.type_demande_id) : null);
          const calculatedStatus = await calculateDossierStatusFromCircuit(d, typeDemande || undefined);
          statusMap.set(d.id, calculatedStatus);
        } catch (err: any) {
          console.error(`Erreur lors du calcul du statut pour le dossier ${d.id}:`, err);
          // Utiliser le statut actuel du dossier en cas d'erreur
          statusMap.set(d.id, d.statut || 'en_attente');
        }
      }
      setDossierStatusCache(statusMap);
    } catch (err: any) {
      console.error('Erreur lors du chargement des dossiers:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des dossiers');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les dossiers côté client et appliquer la pagination
  useEffect(() => {
    let filteredDossiers = [...allDossiers];

    // Filtrer par type de demande (frontend uniquement)
    if (typeDemandeFilter && typeDemandeFilter !== '') {
      filteredDossiers = filteredDossiers.filter((dossier) => {
        // Vérifier par ID
        if (dossier.type_demande_id === typeDemandeFilter) {
          return true;
        }
        // Vérifier par nom (si le type_demande est chargé)
        if (dossier.type_demande?.id === typeDemandeFilter) {
          return true;
        }
        // Vérifier dans le cache
        const cachedTypeDemande = typeDemandeCache.get(typeDemandeFilter);
        if (cachedTypeDemande && dossier.type_demande_id === cachedTypeDemande.id) {
          return true;
        }
        return false;
      });
    }

    // Filtrer par type de permis (frontend uniquement)
    if (typePermisFilter && typePermisFilter !== '') {
      filteredDossiers = filteredDossiers.filter((dossier) => {
        const referencielId = (dossier as any).referenciel_id;
        // Vérifier par referenciel_id
        if (referencielId === typePermisFilter) {
          return true;
        }
        // Vérifier si le référentiel est chargé dans le dossier
        if (dossier.referentiel?.id === typePermisFilter) {
          return true;
        }
        // Vérifier dans le cache
        const cachedReferentiel = referentielsCache.get(typePermisFilter);
        if (cachedReferentiel && referencielId === cachedReferentiel.id) {
          return true;
        }
        return false;
      });
    }

    // Appliquer la pagination côté client
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedDossiers = filteredDossiers.slice(startIndex, endIndex);

    setDossiers(paginatedDossiers);
    setTotal(filteredDossiers.length);
  }, [allDossiers, typeDemandeFilter, typePermisFilter, typeDemandeCache, referentielsCache, page, rowsPerPage]);

  // Effet pour charger les types de demande et types de permis au montage
  useEffect(() => {
    loadTypeDemandes();
    loadTypePermis();
  }, []);

  // Synchroniser les filtres locaux avec les filtres réels au montage
  useEffect(() => {
    setLocalFilters({
      search: searchTerm,
      statut: statutFilter,
      type_demande_id: typeDemandeFilter,
      type_permis_id: typePermisFilter,
    });
  }, []);

  // Effet pour charger les données
  useEffect(() => {
    loadDossiers();
  }, [page, rowsPerPage, searchTerm, statutFilter, typeDemandeFilter, typePermisFilter, refreshTrigger]);

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion des filtres locaux (comme dans FiltresPanel)
  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const handleApplyFilters = () => {
    setSearchTerm(localFilters.search);
    setStatutFilter(localFilters.statut);
    setTypeDemandeFilter(localFilters.type_demande_id);
    setTypePermisFilter(localFilters.type_permis_id);
    setPage(0);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      statut: '',
      type_demande_id: '',
      type_permis_id: '',
    };
    setLocalFilters(clearedFilters);
    setSearchTerm('');
    setStatutFilter('');
    setTypeDemandeFilter('');
    setTypePermisFilter('');
    setPage(0);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(
      (value) => value !== undefined && value !== null && value !== ''
    ).length;
  };

  // Gestion de l'extension des lignes
  const handleToggleExpand = (dossierId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dossierId)) {
        newSet.delete(dossierId);
      } else {
        newSet.add(dossierId);
      }
      return newSet;
    });
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

  // Fonction pour obtenir le statut calculé d'un dossier
  const getCalculatedStatut = (dossier: Dossier): string => {
    return dossierStatusCache.get(dossier.id) || dossier.statut || 'en_attente';
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
  // Priorité : 1. referenciel_id à la racine du dossier (source principale)
  const getTypePermisLabel = (dossier: Dossier): string => {
    const referencielId = (dossier as any).referenciel_id;
    
    // 1. Priorité absolue : referenciel_id à la racine du dossier
    if (referencielId) {
      // D'abord vérifier si l'objet référentiel est directement dans le dossier
      if (dossier.referentiel) {
        if (dossier.referentiel.libelle) {
          return dossier.referentiel.libelle;
        }
        if (dossier.referentiel.code) {
          return dossier.referentiel.code;
        }
      }
      
      // Sinon, vérifier le cache des référentiels
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
    
    // 2. Fallback : vérifier dans la formation (pour compatibilité)
    const formation = dossier.formation;
    if (formation) {
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
      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'transparent' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Gestion des Dossiers</Typography>
        </Box>

        {/* Panel de filtres dans le style de FiltresPanel */}
        <Card elevation={1} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterList sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Filtres
                </Typography>
                {getActiveFiltersCount() > 0 && (
                  <Chip
                    label={getActiveFiltersCount()}
                    color="primary"
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  disabled={getActiveFiltersCount() === 0}
                >
                  Effacer
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleApplyFilters}
                >
                  Appliquer
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Rechercher"
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Numéro candidat, nom, prénom..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={localFilters.statut || ''}
                    onChange={(e) => handleFilterChange('statut', e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="">Tous les statuts</MenuItem>
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="en_cours">En cours</MenuItem>
                    <MenuItem value="valide">Validé</MenuItem>
                    <MenuItem value="rejete">Rejeté</MenuItem>
                    <MenuItem value="transmis">Transmis</MenuItem>
                    <MenuItem value="Cnepc">CNEPC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type de demande</InputLabel>
                  <Select
                    value={localFilters.type_demande_id || ''}
                    onChange={(e) => handleFilterChange('type_demande_id', e.target.value)}
                    label="Type de demande"
                  >
                    <MenuItem value="">Tous les types</MenuItem>
                    {typeDemandes
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((typeDemande) => (
                        <MenuItem key={typeDemande.id} value={typeDemande.id}>
                          {typeDemande.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type de permis</InputLabel>
                  <Select
                    value={localFilters.type_permis_id || ''}
                    onChange={(e) => handleFilterChange('type_permis_id', e.target.value)}
                    label="Type de permis"
                  >
                    <MenuItem value="">Tous les types</MenuItem>
                    {typePermis
                      .sort((a, b) => {
                        const libelleA = a.libelle || a.code || '';
                        const libelleB = b.libelle || b.code || '';
                        return libelleA.localeCompare(libelleB);
                      })
                      .map((referentiel) => (
                        <MenuItem key={referentiel.id} value={referentiel.id}>
                          {referentiel.libelle || referentiel.code || referentiel.id}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
             
            <TableBody>
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton variant="circular" width={24} height={24} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={80} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={150} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={100} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={120} height={20} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                      </TableCell>
                      <TableCell>
                        <Skeleton variant="text" width={100} height={20} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton variant="circular" width={32} height={32} />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : dossiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucun dossier trouvé
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                dossiers.map((dossier) => {
                  const isNouveauPermis = checkIsNouveauPermis(dossier.type_demande?.name);
                  const isExpanded = expandedRows.has(dossier.id);
                  return (
                    <React.Fragment key={dossier.id}>
                      <TableRow 
                        hover
                        sx={{
                          boxShadow: 1,
                          backgroundColor: 'white',
                          transition: 'background-color 0.2s ease',
                          border: 'none',
                          '& td': {
                            border: 'none',
                            borderBottom: 'none',
                          },
                          '&:hover': {
                            boxShadow: 3,
                            backgroundColor: 'white',
                            cursor: 'pointer',
                          },
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(dossier.id)}
                            sx={{ p: 0.5 }}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{dossier.candidat?.numero_candidat || 'N/A'}</TableCell>
                        <TableCell>
                          {dossier.candidat?.personne
                            ? `${dossier.candidat.personne.prenom} ${dossier.candidat.personne.nom}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{getTypePermisLabel(dossier)}</TableCell>
                        <TableCell>
                          {(() => {
                            // Priorité 1: type_demande directement dans le dossier
                            if (dossier.type_demande?.name) {
                              return dossier.type_demande.name;
                            }
                            // Priorité 2: cache des types de demande
                            if (dossier.type_demande_id) {
                              const cachedTypeDemande = typeDemandeCache.get(dossier.type_demande_id);
                              if (cachedTypeDemande?.name) {
                                return cachedTypeDemande.name;
                              }
                            }
                            // Fallback: ID ou N/A
                            return dossier.type_demande_id || 'N/A';
                          })()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatutLabel(getCalculatedStatut(dossier))}
                            color={getStatutColor(getCalculatedStatut(dossier)) as any}
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
                      <TableRow>
                        <TableCell 
                          style={{ paddingBottom: 0, paddingTop: 0, border: 'none' }} 
                          colSpan={8}
                        >
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Formation
                                  </Typography>
                                  <Typography variant="body1">
                                    {dossier.formation?.nom || dossier.formation?.description || 'N/A'}
                                  </Typography>
                                  {dossier.formation?.description && dossier.formation?.nom && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {dossier.formation.description}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Auto-École
                                  </Typography>
                                  <Typography variant="body1">
                                    {isNouveauPermis ? getAutoEcoleName(dossier) : 'N/A'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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


