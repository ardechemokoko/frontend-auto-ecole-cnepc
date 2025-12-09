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
  List,
  ListItem,
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Delete,
  Visibility,
  Person,
  Email,
  Phone,
  LocationOn,
  School,
  Assignment,
} from '@mui/icons-material';
import { Dossier, MesDossiersResponse, AutoEcole, Formation, autoEcoleService } from '../services';
import { CandidatForm, DossierForm } from '../forms';

interface CandidatsTableProps {
  autoEcoleId?: string;
  refreshTrigger?: number;
}

const CandidatsTable: React.FC<CandidatsTableProps> = ({
  autoEcoleId,
  refreshTrigger,
}) => {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  
  // États pour les détails de l'auto-école
  const [autoEcoleDetails, setAutoEcoleDetails] = useState<AutoEcole | null>(null);
  
  // Cache pour les détails de formation
  const [formationsCache, setFormationsCache] = useState<Map<string, Formation>>(new Map());
  
  // États pour les statistiques
  const [statistiques, setStatistiques] = useState<{
    total: number;
    en_attente: number;
    en_cours: number;
    valide: number;
    rejete: number;
  } | null>(null);
  
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

  // Fonction pour enrichir les données de formation
  const enrichFormationData = async (dossiers: Dossier[]) => {
    const formationsToFetch = new Set<string>();
    
    // Identifier les formations qui ont besoin d'être enrichies
    dossiers.forEach(dossier => {
      if (!formationsCache.has(dossier.formation.id)) {
        formationsToFetch.add(dossier.formation.id);
      }
    });
    
    // Récupérer les détails des formations manquantes
    if (formationsToFetch.size > 0) {
      try {
        console.log('🔄 Enrichissement des données de formation pour:', Array.from(formationsToFetch));
        
        // Récupérer toutes les formations de l'auto-école
        const formations = await autoEcoleService.getFormationsByAutoEcole(autoEcoleId || autoEcoleDetails?.id || '');
        
        // Mettre à jour le cache
        const newCache = new Map(formationsCache);
        formations.forEach(formation => {
          newCache.set(formation.id, formation);
        });
        setFormationsCache(newCache);
        
        console.log('✅ Cache de formations mis à jour:', newCache.size, 'formations');
      } catch (error) {
        console.error('❌ Erreur lors de l\'enrichissement des formations:', error);
      }
    }
  };

  // Charger les dossiers (candidats inscrits)
  const loadDossiers = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  [CANDIDATS TABLE] Chargement des dossiers                  ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('🏫 Auto-École ID fourni:', autoEcoleId || 'Aucun (mode "mes dossiers")');
      console.log('═══════════════════════════════════════════════════════════════');

      // Si un autoEcoleId est fourni, utiliser l'endpoint /dossiers
      // Sinon, utiliser l'endpoint /auto-ecoles/mes-dossiers (pour le responsable connecté)
      if (autoEcoleId) {
        console.log('📍 Mode: Dossiers d\'une auto-école spécifique (ID fourni)');
        
        const response = await autoEcoleService.getDossiersByAutoEcoleId(autoEcoleId, {
          statut: statutFilter as any,
        });

        console.log('📋 Réponse complète:', response);
        console.log('📊 Nombre de dossiers:', response.dossiers?.length || 0);
        console.log('═══════════════════════════════════════════════════════════════');

        setDossiers(response.dossiers || []);
        
        // Si on a un autoEcoleId, charger les détails de l'auto-école séparément
        if (autoEcoleId && !autoEcoleDetails) {
          try {
            const autoEcoleData = await autoEcoleService.getAutoEcoleById(autoEcoleId);
            setAutoEcoleDetails(autoEcoleData);
          } catch (err) {
            console.error('❌ Erreur lors du chargement des détails de l\'auto-école:', err);
          }
        }
        
        // Enrichir les données de formation
        await enrichFormationData(response.dossiers || []);
        
        // Pas de statistiques avec /dossiers, on les calcule localement
        const dossiers = response.dossiers || [];
        const stats = {
          total: dossiers.length,
          en_attente: dossiers.filter(d => d.statut === 'en_attente').length,
          en_cours: dossiers.filter(d => d.statut === 'en_cours').length,
          valide: dossiers.filter(d => d.statut === 'valide').length,
          rejete: dossiers.filter(d => d.statut === 'rejete').length,
        };
        setStatistiques(stats);
      } else {
        console.log('📍 Mode: Mes dossiers (responsable connecté)');
        
        const response: MesDossiersResponse = await autoEcoleService.getMesDossiers({
          statut: statutFilter as any,
        });

        console.log('📋 Réponse complète:', response);
        console.log('📊 Auto-école:', response.auto_ecole?.nom_auto_ecole);
        console.log('📊 Nombre de dossiers:', response.dossiers?.length || 0);
        console.log('📊 Statistiques:', response.statistiques);
        console.log('═══════════════════════════════════════════════════════════════');

        // Utiliser directement les données de la réponse
        setDossiers(response.dossiers || []);
        setAutoEcoleDetails(response.auto_ecole || null);
        setStatistiques(response.statistiques || null);
        
        // Enrichir les données de formation
        await enrichFormationData(response.dossiers || []);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des dossiers:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des candidats');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données
  useEffect(() => {
    loadDossiers();
  }, [autoEcoleId, statutFilter, refreshTrigger]);

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
      // Navigation vers la page de détails du candidat avec les données du dossier
      navigate(`/candidat/${dossier.id}`, { 
        state: { dossier } 
      });
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
      {/* Section des détails de l'auto-école */}
      {autoEcoleDetails && (
        <Box sx={{ mb: 4 }}>
            <Card sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <School sx={{ fontSize: 48 }} />
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
                          {autoEcoleDetails.nom_auto_ecole}
                        </Typography>
                        <Chip
                          label={autoEcoleDetails.statut_libelle}
                          color={autoEcoleDetails.statut ? 'success' : 'error'}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      </Box>
                    </Box>
                    
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
                            <CardContent>
                              <Typography variant="overline" color="text.secondary" fontWeight="bold">
                                Contact
                              </Typography>
                              <List dense disablePadding>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                  <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">{autoEcoleDetails.email}</Typography>
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                  <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">{autoEcoleDetails.contact}</Typography>
                                </ListItem>
                                <ListItem disablePadding sx={{ py: 0.5 }}>
                                  <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2">{autoEcoleDetails.adresse}</Typography>
                                </ListItem>
                              </List>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Card variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
                          <CardContent>
                            <Typography variant="overline" color="text.secondary" fontWeight="bold">
                              Responsable
                            </Typography>
                            <List dense disablePadding>
                              <ListItem disablePadding sx={{ py: 0.5 }}>
                                <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight="bold">
                                  {autoEcoleDetails.responsable.prenom} {autoEcoleDetails.responsable.nom}
                                </Typography>
                              </ListItem>
                              <ListItem disablePadding sx={{ py: 0.5 }}>
                                <Email fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{autoEcoleDetails.responsable.email}</Typography>
                              </ListItem>
                              <ListItem disablePadding sx={{ py: 0.5 }}>
                                <Phone fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2">{autoEcoleDetails.responsable.contact}</Typography>
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </CardContent>
            </Card>
        </Box>
      )}
      
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          {autoEcoleDetails ? `Candidats de ${autoEcoleDetails.nom_auto_ecole}` : 'Candidats Inscrits'}
        </Typography>
      </Box>

      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {statistiques.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  En attente
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {statistiques.en_attente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  En cours
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {statistiques.en_cours}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Validés
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {statistiques.valide}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ bgcolor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Rejetés
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {statistiques.rejete}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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
       
      </Box>

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper sx={{ bgcolor: 'transparent' }}>
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
                          <Typography 
                            variant="subtitle2" 
                            fontWeight="medium"
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                color: 'primary.main',
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={() => navigate(`/candidat/${dossier.id}`, { 
                              state: { dossier } 
                            })}
                          >
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
                            {(() => {
                              // Utiliser les données enrichies du cache si disponibles
                              const enrichedFormation = formationsCache.get(dossier.formation.id) || dossier.formation;
                              const formation = enrichedFormation;
                              
                              // 1. Nom direct de la formation
                              if (formation.nom && formation.nom.trim()) {
                                return formation.nom;
                              }
                              
                              // 2. Description de la formation
                              if (formation.description && formation.description.trim()) {
                                return formation.description;
                              }
                              
                              // 3. Type de permis avec libellé
                              if (formation.type_permis) {
                                const typePermis = formation.type_permis as any;
                                // Vérifier si c'est un Referentiel (a libelle)
                                if (typePermis.libelle && typePermis.libelle.trim()) {
                                  return `Formation ${typePermis.libelle}`;
                                }
                                // Vérifier si c'est un TypePermis (a nom)
                                if (typePermis.nom && typePermis.nom.trim()) {
                                  return `Formation ${typePermis.nom}`;
                                }
                              }
                              
                              // 4. TypePermis alternatif
                              if (formation.typePermis) {
                                const typePermis = formation.typePermis as any;
                                // Vérifier si c'est un Referentiel (a libelle)
                                if (typePermis.libelle && typePermis.libelle.trim()) {
                                  return `Formation ${typePermis.libelle}`;
                                }
                                // Vérifier si c'est un TypePermis (a nom)
                                if (typePermis.nom && typePermis.nom.trim()) {
                                  return `Formation ${typePermis.nom}`;
                                }
                              }
                              
                              // 5. Fallback avec montant et durée
                              const montant = formation.montant_formate || (formation.montant ? `${formation.montant} FCFA` : '');
                              const duree = formation.duree_jours ? `${formation.duree_jours} jours` : '';
                              const details = [montant, duree].filter(Boolean).join(' - ');
                              
                              return details ? `Formation (${details})` : 'Formation';
                            })()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dossier.formation.montant_formate || `${dossier.formation.montant} FCFA`}
                            {dossier.formation.duree_jours && ` - ${dossier.formation.duree_jours} jours`}
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
