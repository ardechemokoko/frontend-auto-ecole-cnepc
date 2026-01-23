import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
import { typeDemandeService } from '../../cnepc/services';
import { TypeDemande } from '../../cnepc/types/type-demande';
import ValidationService from '../services/validationService';
import { ROUTES } from '../../../shared/constants';

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
  const navigate = useNavigate();
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeDemandeCache, setTypeDemandeCache] = useState<Map<string, TypeDemande>>(new Map());

  useEffect(() => {
    chargerDemandes();
    chargerStatistiques();
  }, [filtres, refreshTrigger, autoEcoleId, formationId, currentAutoEcoleId]);

  // Fonction pour enrichir les données de type de demande
  const enrichTypeDemandeData = async (dossiers: any[]): Promise<Map<string, TypeDemande>> => {
    const typeDemandesToFetch = new Set<string>();
    
    // Identifier les types de demande qui ont besoin d'être enrichis
    dossiers.forEach(dossier => {
      if (dossier.type_demande_id && !dossier.type_demande && !typeDemandeCache.has(dossier.type_demande_id)) {
        typeDemandesToFetch.add(dossier.type_demande_id);
      }
    });
    
    // Récupérer les détails des types de demande manquants
    if (typeDemandesToFetch.size > 0) {
      try {
        const typeDemandePromises = Array.from(typeDemandesToFetch).map(id => 
          typeDemandeService.getTypeDemandeById(id).catch(err => {
            console.error(`❌ Erreur lors du chargement du type de demande ${id}:`, err);
            return null;
          })
        );
        
        const typeDemandes = (await Promise.all(typeDemandePromises)).filter(td => td !== null) as TypeDemande[];
        
        // Mettre à jour le cache
        const newCache = new Map(typeDemandeCache);
        typeDemandes.forEach(typeDemande => {
          newCache.set(typeDemande.id, typeDemande);
        });
        setTypeDemandeCache(newCache);
        return newCache;
      } catch (error) {
        console.error('❌ Erreur lors de l\'enrichissement des types de demande:', error);
        return typeDemandeCache;
      }
    }
    return typeDemandeCache;
  };

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
    
    // Enrichir les types de demande
    const updatedCache = await enrichTypeDemandeData(dossiersComplets);
    
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
        } : undefined,
        type_demande_id: dossier.type_demande_id,
        type_demande: dossier.type_demande || (dossier.type_demande_id ? updatedCache.get(dossier.type_demande_id) : undefined)
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
      // Charger les statistiques réelles des demandes d'inscription depuis l'API
      const resolvedAutoEcoleId = autoEcoleId || getAutoEcoleId();
      
      if (!resolvedAutoEcoleId) {
        console.warn('⚠️ Aucun ID d\'auto-école trouvé pour charger les statistiques');
        setStatistiques({
          total: 0,
          enAttente: 0,
          enCours: 0,
          validees: 0,
          rejetees: 0,
          parAutoEcole: {}
        });
        return;
      }

      // Récupérer tous les dossiers sans filtre pour calculer les statistiques réelles
      const response = await autoEcoleService.getDossiersByAutoEcoleId(resolvedAutoEcoleId);
      const dossiers = response.dossiers || [];

      // Filtrer uniquement les demandes d'inscription (exclure les dossiers validés/transmis)
      // Les demandes d'inscription sont les dossiers qui ne sont pas encore validés/transmis au CNEPC
      const demandesInscription = dossiers.filter((d: any) => {
        const statut = d.statut?.toLowerCase();
        // Exclure les statuts qui indiquent que le dossier est déjà traité/transmis
        return statut !== 'valide' && 
               statut !== 'validated' && 
               statut !== 'transmis' && 
               statut !== 'transmitted';
      });

      // Calculer les statistiques à partir des demandes d'inscription uniquement
      const stats: StatistiquesDemandes = {
        total: demandesInscription.length,
        enAttente: demandesInscription.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'en_attente' || statut === 'pending';
        }).length,
        enCours: demandesInscription.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'en_cours' || statut === 'in_progress';
        }).length,
        validees: demandesInscription.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'validee' || statut === 'validated';
        }).length,
        rejetees: demandesInscription.filter((d: any) => {
          const statut = d.statut?.toLowerCase();
          return statut === 'rejetee' || statut === 'rejected' || statut === 'rejete';
        }).length,
        parAutoEcole: {}
      };
      
      setStatistiques(stats);
      console.log('📊 Statistiques des demandes d\'inscription chargées depuis l\'API:', stats);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    
    // Appeler le callback si fourni (pour compatibilité)
    if (onCandidatSelect) {
      onCandidatSelect(demande);
    }
    
    // Naviguer vers la page de détails du candidat pour le suivi du circuit
    // Passer un état pour indiquer qu'on vient de DemandesInscriptionTable
    navigate(ROUTES.RECEPTION_CANDIDAT_DETAILS.replace(':id', demande.id), {
      state: { from: 'demandes-inscription' }
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Chargement des demandes d'inscription...</Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Statistiques */}
      {statistiques && (
        <Grid container spacing={1} sx={{ mb: 1.5, flexShrink: 0 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" gutterBottom variant="body2" sx={{ mb: 0.5 }}>
                  Total
                </Typography>
                <Typography variant="h5">
                  {statistiques.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" gutterBottom variant="body2" sx={{ mb: 0.5 }}>
                  En attente
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {statistiques.enAttente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" gutterBottom variant="body2" sx={{ mb: 0.5 }}>
                  Validées
                </Typography>
                <Typography variant="h5" color="success.main">
                  {statistiques.validees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography color="text.secondary" gutterBottom variant="body2" sx={{ mb: 0.5 }}>
                  Rejetées
                </Typography>
                <Typography variant="h5" color="error.main">
                  {statistiques.rejetees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtres et actions */}
      <Box sx={{ mb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
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
      </Box>

      {/* Tableau des demandes */}
      <Box
        component={Paper}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          maxHeight: 'calc(100vh - 400px)'
        }}
      >
        <TableContainer 
          sx={{
            overflow: 'auto',
            flex: 1,
            minHeight: 0
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'white' }}>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Numéro</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Nom & Prenom</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Formation</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Type de demande</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Étape</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Date demande</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Statut</TableCell>
                <TableCell sx={{ py: 1, fontWeight: 600, color: 'black' }}>Documents</TableCell>
                <TableCell align="right" sx={{ py: 1, fontWeight: 600, color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {demandes
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((demande) => (
              <TableRow key={demande.id}>
                <TableCell sx={{ py: 0.75 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {demande.numero}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.25 }}>
                      {demande.eleve.firstName} {demande.eleve.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                      {demande.eleve.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                      {demande.eleve.phone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mb: 0.25 }}>
                      {(demande as any).formation?.nom || 'Formation'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} sx={{ lineHeight: 1.2 }}>
                      <CurrencyDollarIcon className="w-3 h-3" /> {(demande as any).formation?.montant || 'N/A'}
                    </Typography>
                    </Box>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  {(() => {
                    const demandeData = demande as any;
                    if (demandeData.type_demande) {
                      return (
                        <Chip
                          label={demandeData.type_demande.name}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      );
                    }
                    if (demandeData.type_demande_id) {
                      const cachedTypeDemande = typeDemandeCache.get(demandeData.type_demande_id);
                      if (cachedTypeDemande) {
                        return (
                          <Chip
                            label={cachedTypeDemande.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        );
                      }
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Chargement...
                        </Typography>
                      );
                    }
                    return (
                      <Typography variant="body2" color="text.secondary">
                        Non spécifié
                      </Typography>
                    );
                  })()}
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Box>
                    { (demande as any).etape?.libelle ? (
                      <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                        {(demande as any).etape?.libelle}
                      </Typography>
                    ) : (
                      <Chip 
                        icon={<ExclamationTriangleIcon className="w-3 h-3" />} 
                        label="Demande d'inscription" 
                        color="warning" 
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                    {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip
                    label={getStatutLabel(demande.statut)}
                    color={getStatutColor(demande.statut) as any}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                      {demande.documents.length} doc(s)
                    </Typography>
                    {demande.documents.length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {demande.documents.filter((doc: any) => doc.valide).length} validé(s)
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ py: 0.75 }}>
                  <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleVoirDetails(demande)}
                      color="primary"
                      sx={{ padding: 0.5 }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton size="small" color="secondary" sx={{ padding: 0.5 }}>
                      <PencilIcon className="w-4 h-4" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(demande)}
                      title="Supprimer la demande"
                      sx={{ padding: 0.5 }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination
          sx={{ flexShrink: 0, py: 0.5, borderTop: '1px solid #e5e7eb' }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={demandes.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`}
        />
      </Box>

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