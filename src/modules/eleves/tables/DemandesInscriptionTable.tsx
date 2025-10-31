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
  IconButton,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
// Heroicons imports
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CurrencyDollarIcon, IdentificationIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DemandeInscription, FiltresDemandes, StatistiquesDemandes } from '../types/inscription';
// Import des utilitaires pour récupérer l'ID de l'auto-école
import { getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';
import ValidationService from '../services/validationService';

interface DemandesInscriptionTableProps {
  onCandidatSelect?: (candidat: DemandeInscription) => void;
  refreshTrigger?: number; // Pour forcer le rafraîchissement
  onDelete?: () => void; // Callback après suppression réussie
  autoEcoleId?: string; // ID de l'auto-école pour récupérer les dossiers
  formationId?: string; // ID de la formation pour filtrer les dossiers (optionnel)
}

const DemandesInscriptionTable: React.FC<DemandesInscriptionTableProps> = ({ 
  onCandidatSelect, 
  refreshTrigger, 
  onDelete, 
  autoEcoleId,
  formationId 
}) => {
  const [demandes, setDemandes] = useState<DemandeInscription[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiquesDemandes | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState<FiltresDemandes>({});
  const [recherche, setRecherche] = useState('');
  // Suppression des maps de cache local - utilisation directe des données API
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState<DemandeInscription | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [dataSource, setDataSource] = useState<'api' | null>(null);
  const [currentAutoEcoleId, setCurrentAutoEcoleId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    chargerDemandes();
    chargerStatistiques();
  }, [filtres, refreshTrigger, autoEcoleId, formationId, currentAutoEcoleId]);

  // Fonction pour traiter les dossiers (même structure que CandidatsTable)
  const processDossiers = async (dossiers: any[]) => {
    console.log('📁 Dossiers trouvés:', dossiers.length);
    console.log('📋 Premier dossier (exemple):', dossiers[0]);
    console.log('🔍 Tous les dossiers bruts:', dossiers);
    
    // FORCER la récupération des vraies données depuis l'API
    // pour éviter les données persistantes du localStorage
    console.log('🔄 Récupération des vraies données depuis l\'API pour chaque dossier...');
    setLoadingDetails(true);
    
    const dossiersComplets = await Promise.all(
      dossiers.map(async (dossier: any) => {
        try {
          console.log(`📋 Récupération des vraies données du dossier ${dossier.id}...`);
          const dossierComplet = await autoEcoleService.getDossierById(dossier.id);
          console.log(`✅ Dossier ${dossier.id} avec vraies données:`, dossierComplet);
          return dossierComplet;
        } catch (error) {
          console.error(`❌ Erreur lors de la récupération du dossier ${dossier.id}:`, error);
          // Retourner le dossier original en cas d'erreur
          return dossier;
        }
      })
    );
    
    console.log('📊 Dossiers avec vraies données récupérés:', dossiersComplets.length);
    setLoadingDetails(false);
    
    // Convertir les dossiers en format DemandeInscription et filtrer les demandes validées
    const demandesData: DemandeInscription[] = dossiersComplets
      .filter((dossier: any) => {
        // Filtrer les dossiers avec statut "valide" (cachés de la liste)
        // Les dossiers validés sont ceux avec statut "valide" ou "validé"
        const statut = dossier.statut?.toLowerCase() || '';
        const isValide = statut === 'valide' || statut === 'validé';
        if (isValide) {
          console.log('🚫 Dossier validé filtré:', dossier.id, 'statut:', dossier.statut);
        }
        return !isValide;
      })
      .map((dossier: any) => {
      // Mapper le statut vers le format attendu
      const mapStatut = (statut: string): 'en_attente' | 'en_cours' | 'validee' | 'rejetee' => {
        switch (statut) {
          case 'en_attente': return 'en_attente';
          case 'en_cours': return 'en_cours';
          case 'valide': return 'validee';
          case 'rejete': return 'rejetee';
          default: return 'en_attente';
        }
      };

      // Utiliser la structure de données de l'endpoint /dossiers (même que CandidatsTable)
      const candidat = dossier.candidat;
      const formation = dossier.formation;

      // Logs de débogage pour la structure des données
      console.log('🔍 DEBUG Candidat - Dossier ID:', dossier.id);
      console.log('🔍 DEBUG Candidat - Structure complète:', candidat);
      console.log('🔍 DEBUG Candidat - Personne:', candidat?.personne);
      console.log('🔍 DEBUG Candidat - Formation:', formation);
      console.log('🔍 DEBUG Candidat - Auto-école:', dossier.auto_ecole);

      // Déterminer le nom de la formation (utiliser la structure complète de l'API)
      const getFormationName = (formation: any) => {
        // 1. Nom direct de la formation
        if (formation?.nom && formation.nom.trim()) {
          return formation.nom;
        }
        
        // 2. Description de la formation
        if (formation?.description && formation.description.trim()) {
          return formation.description;
        }
        
        // 3. Type de permis avec libellé (structure complète de l'API)
        if (formation?.type_permis?.libelle) {
          return `Formation ${formation.type_permis.libelle}`;
        }
        
        // 4. Type de permis avec nom
        if (formation?.type_permis?.nom) {
          return `Formation ${formation.type_permis.nom}`;
        }
        
        // 5. Session avec libellé
        if (formation?.session?.libelle) {
          return `Formation ${formation.session.libelle}`;
        }
        
        return 'Formation';
      };

      const formationNom = getFormationName(formation);
      const formationMontant = formation?.montant_formate || (formation?.montant ? `${formation.montant} FCFA` : 'N/A');

      // Logs de débogage pour les valeurs extraites
      console.log('🔍 DEBUG Valeurs extraites:');
      console.log('  - Prénom:', candidat?.personne?.prenom);
      console.log('  - Nom:', candidat?.personne?.nom);
      console.log('  - Email:', candidat?.personne?.email);
      console.log('  - Contact:', candidat?.personne?.contact);
      console.log('  - Adresse:', candidat?.personne?.adresse);

      return {
        id: dossier.id,
        numero: `DOS-${dossier.id.substring(0, 8).toUpperCase()}`,
        candidat_id: dossier.candidat_id,
        personne_id: candidat?.personne_id || null,
        eleve: {
          firstName: candidat?.personne?.prenom || '',
          lastName: candidat?.personne?.nom || '',
          email: candidat?.personne?.email || '',
          phone: candidat?.personne?.contact || '',
          address: candidat?.personne?.adresse || '',
          birthDate: candidat?.date_naissance || '',
          nationality: candidat?.nationalite || '',
          lieuNaissance: candidat?.lieu_naissance || '',
          nationaliteEtrangere: undefined
        },
        autoEcole: {
          id: dossier.auto_ecole_id,
          name: dossier.auto_ecole?.nom_auto_ecole || 'Auto-école',
          email: dossier.auto_ecole?.email || ''
        },
        dateDemande: dossier.date_creation || dossier.created_at,
        statut: mapStatut(dossier.statut),
        documents: dossier.documents || [],
        commentaires: dossier.commentaires || '',
        formation: {
          id: dossier.formation_id,
          nom: formationNom,
          montant: formationMontant,
          description: formation?.description || ''
        },
        etape: dossier.etape ? {
          id: dossier.etape.id,
          libelle: dossier.etape.libelle,
          ordre: dossier.etape.ordre,
          statut: dossier.etape.statut_systeme
        } : undefined
      };
    });
    
    console.log('✅ Demandes transformées:', demandesData.length);
    console.log('📊 Demandes transformées (détail):', demandesData);
    
    // Appliquer les filtres
    let demandesFiltrees = demandesData;
    
    console.log('🔍 Filtres appliqués:', filtres);
    console.log('📋 Demandes avant filtrage:', demandesFiltrees.length);
    
    // Filtrage par formation (côté client)
    if (formationId) {
      console.log('🔍 Filtrage par formation ID (côté client):', formationId);
      demandesFiltrees = demandesFiltrees.filter(d => {
        const demande = d as any;
        return demande.formation?.id === formationId;
      });
      console.log('📋 Demandes après filtrage formation:', demandesFiltrees.length);
    }
    
    if (filtres.statut) {
      console.log('🔍 Filtrage par statut:', filtres.statut);
      demandesFiltrees = demandesFiltrees.filter(d => d.statut === filtres.statut);
      console.log('📋 Demandes après filtrage statut:', demandesFiltrees.length);
    }
    
    if (filtres.recherche) {
      const recherche = filtres.recherche.toLowerCase();
      console.log('🔍 Filtrage par recherche:', recherche);
      demandesFiltrees = demandesFiltrees.filter(d => {
        const demande = d as any;
        return (
          demande.eleve.firstName.toLowerCase().includes(recherche) ||
          demande.eleve.lastName.toLowerCase().includes(recherche) ||
          demande.eleve.email.toLowerCase().includes(recherche) ||
          demande.numero.toLowerCase().includes(recherche)
        );
      });
      console.log('📋 Demandes après filtrage recherche:', demandesFiltrees.length);
    }
    
    console.log('📋 Demandes finales affichées:', demandesFiltrees.length);
    console.log('📊 Demandes finales (détail):', demandesFiltrees);
    
    setDemandes(demandesFiltrees);
  };

  const chargerDemandes = async () => {
    try {
      setLoading(true);
      console.log('📋 Chargement des demandes d\'inscription...');
      
      // Récupérer l'ID de l'auto-école (prop ou depuis localStorage)
      const resolvedAutoEcoleId = autoEcoleId || getAutoEcoleId();
      
      if (!resolvedAutoEcoleId) {
        console.warn('⚠️ Aucun ID d\'auto-école trouvé (ni en prop ni dans localStorage)');
        setDemandes([]);
        setLoading(false);
        return;
      }
      
      // Stocker l'ID résolu pour l'affichage
      setCurrentAutoEcoleId(resolvedAutoEcoleId);
      
      console.log('🏫 Chargement des dossiers pour l\'auto-école ID:', resolvedAutoEcoleId);
      if (formationId) {
        console.log('📚 Filtrage par formation ID:', formationId);
      }
      
      try {
        // Utiliser la même méthode que CandidatsTable : getDossiersByAutoEcoleId
        // Ne pas filtrer par formation côté API pour récupérer tous les dossiers
        const filters = {
          statut: filtres.statut as any
          // formation_id: formationId // Commenté temporairement pour récupérer tous les dossiers
        };
        
        console.log('🔍 Filtres envoyés à l\'API:', filters);
        console.log('📚 Formation ID (filtrage côté client):', formationId);
        
        const response = await autoEcoleService.getDossiersByAutoEcoleId(resolvedAutoEcoleId, filters);
        
        console.log('📦 Dossiers récupérés depuis l\'API:', response.dossiers?.length || 0);
        console.log('📋 Structure de la réponse:', response);
        console.log('📊 Dossiers bruts de l\'API:', response.dossiers);
        
        if (response.dossiers && response.dossiers.length > 0) {
          setDataSource('api');
          await processDossiers(response.dossiers);
        } else {
          console.log('⚠️ Aucun dossier trouvé pour cette auto-école via API');
          setDemandes([]);
        }
      } catch (error: any) {
        console.error('❌ Erreur lors de la récupération des dossiers depuis l\'API:', error);
        setDemandes([]);
        
        // Afficher un message d'erreur spécifique
        if (error.response?.status === 404) {
          console.warn('⚠️ Auto-école non trouvée');
        } else if (error.response?.status === 401) {
          console.warn('⚠️ Non autorisé à accéder à cette auto-école');
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des dossiers:', error);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  };


  const chargerStatistiques = async () => {
    try {
      // Utiliser les demandes déjà chargées pour calculer les statistiques
      const stats: StatistiquesDemandes = {
        total: demandes.length,
        enAttente: demandes.filter(d => d.statut === 'en_attente').length,
        enCours: demandes.filter(d => d.statut === 'en_cours').length,
        validees: demandes.filter(d => d.statut === 'validee').length,
        rejetees: demandes.filter(d => d.statut === 'rejetee').length,
        parAutoEcole: {}
      };
      
      setStatistiques(stats);
      console.log('📊 Statistiques calculées:', stats);
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      // Les statistiques par défaut (vides) seront utilisées
      setStatistiques({
        total: 0,
        enAttente: 0,
        enCours: 0,
        validees: 0,
        rejetees: 0,
        parAutoEcole: {}
      });
    }
  };

  const handleRecherche = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecherche(event.target.value);
    setFiltres(prev => ({ ...prev, recherche: event.target.value }));
  };

  const handleFiltreStatut = (statut: string) => {
    setFiltres(prev => ({ ...prev, statut: statut || undefined }));
  };

  const handleDeleteClick = (demande: DemandeInscription) => {
    setDemandeToDelete(demande);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!demandeToDelete) return;

    setDeleteLoading(true);
    try {
      await autoEcoleService.deleteDossier(demandeToDelete.id);
      
      // Afficher un message de succès
      setSnackbar({
        open: true,
        message: `La demande d'inscription de ${demandeToDelete.eleve.firstName} ${demandeToDelete.eleve.lastName} a été supprimée avec succès`,
        severity: 'success'
      });

      // Fermer le dialogue
      setDeleteDialogOpen(false);
      setDemandeToDelete(null);

      // Rafraîchir la liste
      await chargerDemandes();
      await chargerStatistiques();

      // Appeler le callback si fourni
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erreur lors de la suppression de la demande',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDemandeToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'warning';
      case 'en_cours': return 'info';
      case 'valide':
      case 'validee': return 'success';
      case 'eleve_inscrit': return 'success';
      case 'rejete':
      case 'rejetee': return 'error';
      default: return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'En cours';
      case 'valide':
      case 'validee': return 'Validé';
      case 'eleve_inscrit': return 'Élève inscrit';
      case 'rejete':
      case 'rejetee': return 'Rejeté';
      default: return statut;
    }
  };

  const handleVoirDetails = (demande: DemandeInscription) => {
    console.log('📋 Détails du dossier sélectionné:', demande);
    
    if (onCandidatSelect) {
      onCandidatSelect(demande);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des demandes d'inscription...</Typography>
      </Box>
    );
  }

  if (loadingDetails) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Récupération des vraies données depuis l'API...</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 3 }}>
      {/* Informations sur la source de données */}
      {dataSource && currentAutoEcoleId && (
        <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Demandes d'inscription
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🏫 Auto-école ID: {currentAutoEcoleId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🔄 Données récupérées depuis l'API
            </Typography>
            {loadingDetails && (
              <Typography variant="body2" color="text.secondary">
                ⏳ Récupération des vraies données...
              </Typography>
            )}
            {formationId && (
              <Typography variant="body2" color="text.secondary">
                📚 Filtrage par formation: {formationId}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total
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
                  En attente
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistiques.enAttente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Validées
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistiques.validees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Rejetées
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistiques.rejetees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres et actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher..."
          value={recherche}
          onChange={handleRecherche}
          InputProps={{
            startAdornment: <MagnifyingGlassIcon className="w-5 h-5 mr-1 text-gray-400" />
          }}
          sx={{ minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={filtres.statut || ''}
            onChange={(e) => handleFiltreStatut(e.target.value)}
            label="Statut"
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="en_attente">En attente</MenuItem>
            <MenuItem value="en_cours">En cours</MenuItem>
            <MenuItem value="validee">Validée</MenuItem>
            <MenuItem value="rejetee">Rejetée</MenuItem>
          </Select>
        </FormControl>
        
        {/* Bouton de débogage */}
        <Button
          variant="outlined"
          onClick={() => {
            console.log('🔍 DEBUG - État actuel:');
            console.log('📊 Demandes affichées:', demandes.length);
            console.log('🔍 Filtres appliqués:', filtres);
            console.log('📚 Formation ID:', formationId);
            console.log('🏫 Auto-école ID:', currentAutoEcoleId);
          }}
          sx={{ minWidth: 120 }}
        >
          Debug
        </Button>
        
        {/* Bouton pour forcer le rechargement des vraies données */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log('🔄 Forçage du rechargement des vraies données...');
            chargerDemandes();
          }}
          sx={{ minWidth: 150 }}
        >
          🔄 Recharger vraies données
        </Button>
      </Box>

      {/* Tableau des demandes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Nom & Prenom</TableCell>
              <TableCell>Formation</TableCell>
              <TableCell>Étape</TableCell>
              <TableCell>Date demande</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demandes.map((demande) => (
              <TableRow key={demande.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {demande.numero}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {demande.eleve.firstName} {demande.eleve.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {demande.eleve.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {demande.eleve.phone}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <IdentificationIcon className="w-4 h-4" /> {demande.numero}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {(demande as any).formation?.nom || 'Formation'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <CurrencyDollarIcon className="w-4 h-4" /> {(demande as any).formation?.montant || 'N/A'}
                    </Typography>
                    {(demande as any).formation?.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        📝 {(demande as any).formation.description.substring(0, 30)}...
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    { (demande as any).etape?.libelle ? (
                      <>
                    <Typography variant="body2">
                          {(demande as any).etape?.libelle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                          Ordre: {(demande as any).etape?.ordre || '-'}
                    </Typography>
                      </>
                    ) : (
                      <Chip 
                        icon={<ExclamationTriangleIcon className="w-4 h-4" />} 
                        label="Étape: Demande d'inscription" 
                        color="warning" 
                        size="small"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatutLabel(demande.statut)}
                    color={getStatutColor(demande.statut) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {demande.documents.length} document(s)
                    </Typography>
                    {demande.documents.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {demande.documents.filter((doc: any) => doc.valide).length} validé(s)
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleVoirDetails(demande)}
                    color="primary"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="small" color="secondary">
                    <PencilIcon className="w-4 h-4" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteClick(demande)}
                    title="Supprimer la demande"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer la demande d'inscription de{' '}
            <strong>
              {demandeToDelete?.eleve.firstName} {demandeToDelete?.eleve.lastName}
            </strong>
            {' '}?
            <br />
            <br />
            Cette action est irréversible et supprimera définitivement la demande et tous ses documents associés.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les messages de succès/erreur */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default DemandesInscriptionTable;