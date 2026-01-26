import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Fade,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  Phone,
  LocationOn,
  School,
  Assignment,
  Download,
  Visibility,
  CalendarToday,
  Badge,
  Flag,
  Description,
  CheckCircle,
  Error,
  Warning,
  Category,
} from '@mui/icons-material';
import { autoEcoleService, typeDemandeService } from '../services';
import { Dossier, Formation } from '../types/auto-ecole';
import { TypeDemande } from '../types/type-demande';

const CandidateDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formationsCache, setFormationsCache] = useState<Map<string, Formation>>(new Map());
  const [typeDemandeCache, setTypeDemandeCache] = useState<Map<string, TypeDemande>>(new Map());
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Utiliser l'ID du paramètre de route comme dossierId
  const dossierId = id;

  // Fonction utilitaire pour extraire le type de permis
  const getTypePermisLabel = (formation: Formation): string => {
    // 🔍 DÉBOGAGE : Log de la structure de formation
    console.log('🔍 [CANDIDAT DETAILS] Structure de formation:', {
      formation_id: formation.id,
      formation_nom: formation.nom,
      formation_type_permis_id: formation.type_permis_id,
      formation_type_permis: formation.type_permis,
      formation_typePermis: formation.typePermis,
      formation_duree_jours: formation.duree_jours,
      formation_complete: formation
    });
    
    // 1. Vérifier type_permis
    if (formation.type_permis) {
      const typePermis = formation.type_permis as any;
      if (typePermis.libelle && typePermis.libelle.trim()) {
        console.log('✅ Type permis trouvé (libelle):', typePermis.libelle);
        return typePermis.libelle;
      }
      if (typePermis.nom && typePermis.nom.trim()) {
        console.log('✅ Type permis trouvé (nom):', typePermis.nom);
        return typePermis.nom;
      }
    }
    
    // 2. Vérifier typePermis alternatif
    if (formation.typePermis) {
      const typePermis = formation.typePermis as any;
      if (typePermis.libelle && typePermis.libelle.trim()) {
        console.log('✅ Type permis alternatif trouvé (libelle):', typePermis.libelle);
        return typePermis.libelle;
      }
      if (typePermis.nom && typePermis.nom.trim()) {
        console.log('✅ Type permis alternatif trouvé (nom):', typePermis.nom);
        return typePermis.nom;
      }
    }
    
    // 3. Utiliser l'ID du type de permis comme fallback
    if (formation.type_permis_id) {
      console.log('⚠️ Utilisation de l\'ID comme fallback:', formation.type_permis_id);
      return `Type ${formation.type_permis_id}`;
    }
    
    console.log('❌ Aucun type de permis trouvé');
    return 'Non disponible';
  };

  // Fonction pour enrichir les données de formation
  const enrichFormationData = async (dossier: Dossier) => {
    if (!dossier.formation || !dossier.formation.id || !dossier.auto_ecole_id) {
      return;
    }
    
    try {
      console.log('🔄 Enrichissement des données de formation pour:', dossier.formation.id);
      
      // Récupérer toutes les formations de l'auto-école pour avoir les détails complets
      const formations = await autoEcoleService.getFormationsByAutoEcole(dossier.auto_ecole_id);
      
      // Trouver la formation correspondante avec les relations complètes
      const enrichedFormation = formations.find(f => f.id === dossier.formation!.id);
      
      if (enrichedFormation) {
        console.log('✅ Formation enrichie trouvée:', enrichedFormation);
        
        // Mettre à jour le dossier avec la formation enrichie
        setDossier(prevDossier => ({
          ...prevDossier!,
          formation: enrichedFormation
        }));
        
        // Mettre à jour le cache
        const newCache = new Map(formationsCache);
        newCache.set(enrichedFormation.id, enrichedFormation);
        setFormationsCache(newCache);
      } else {
        console.warn('⚠️ Formation enrichie non trouvée pour:', dossier.formation.id);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enrichissement des formations:', error);
    }
  };

  // Fonction pour enrichir les données du type de demande
  const enrichTypeDemandeData = async (dossier: Dossier) => {
    if (!dossier.type_demande_id) {
      return;
    }

    // Si le type de demande est déjà chargé, ne rien faire
    if (dossier.type_demande) {
      return;
    }

    // Si le type de demande est dans le cache, l'utiliser
    if (typeDemandeCache.has(dossier.type_demande_id)) {
      const cachedTypeDemande = typeDemandeCache.get(dossier.type_demande_id)!;
      setDossier(prevDossier => ({
        ...prevDossier!,
        type_demande: cachedTypeDemande
      }));
      return;
    }

    try {
      console.log('🔄 Enrichissement du type de demande pour:', dossier.type_demande_id);
      
      const typeDemande = await typeDemandeService.getTypeDemandeById(dossier.type_demande_id);
      
      console.log('✅ Type de demande chargé:', typeDemande);
      
      // Mettre à jour le dossier avec le type de demande
      setDossier(prevDossier => ({
        ...prevDossier!,
        type_demande: typeDemande
      }));
      
      // Mettre à jour le cache
      const newCache = new Map(typeDemandeCache);
      newCache.set(typeDemande.id, typeDemande);
      setTypeDemandeCache(newCache);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enrichissement du type de demande:', error);
    }
  };


  // Charger les détails du dossier
  useEffect(() => {
    const loadDossierDetails = async () => {
      if (!dossierId) {
        setError('ID du dossier manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Chargement des détails du dossier:', dossierId);
        
        // Essayer d'abord de récupérer les données depuis l'état de navigation
        const stateDossier = location.state?.dossier;
        if (stateDossier) {
          console.log('✅ Utilisation des données passées en paramètre:', stateDossier);
          setDossier(stateDossier);
          
          // Enrichir les données de formation et type de demande en arrière-plan
          enrichFormationData(stateDossier);
          enrichTypeDemandeData(stateDossier);
          
          setLoading(false);
          return;
        }
        
        // Sinon, essayer l'API
        try {
          const dossier = await autoEcoleService.getDossierById(dossierId);
          
          // Mapper les documents selon la structure de l'API
          // Les documents de l'API ont la structure: { id, documentable_id, documentable_type, nom_fichier, chemin_fichier, etc. }
          if (dossier.documents && Array.isArray(dossier.documents)) {
            dossier.documents = dossier.documents.map((doc: any) => ({
              id: doc.id,
              dossier_id: doc.documentable_id || dossier.id,
              type_document_id: doc.type_document_id || null,
              nom: doc.nom_fichier || doc.nom || 'Document',
              nom_fichier: doc.nom_fichier || doc.nom || 'Document',
              chemin_fichier: doc.chemin_fichier,
              type_mime: doc.type_mime || 'application/octet-stream',
              taille_fichier: doc.taille_fichier || 0,
              taille_fichier_formate: doc.taille_fichier_formate || '0 B',
              statut: doc.statut || 'en_attente',
              valide: doc.valide !== undefined ? doc.valide : false,
              valide_libelle: doc.valide_libelle || (doc.valide ? 'Validé' : 'Non validé'),
              date_upload: doc.created_at || doc.date_upload || new Date().toISOString(),
              commentaires: doc.commentaires || null,
              created_at: doc.created_at,
              updated_at: doc.updated_at
            }));
          }
          
          setDossier(dossier);
          console.log('✅ Dossier chargé via API:', dossier);
          console.log('📄 Documents dans le dossier:', dossier.documents?.length || 0);
          
          // Enrichir les données de formation et type de demande en arrière-plan
          enrichFormationData(dossier);
          enrichTypeDemandeData(dossier);
        } catch (apiError: any) {
          console.warn('⚠️ API non disponible, utilisation des données de base:', apiError);
          
          // Si l'API échoue, créer un dossier minimal avec les données disponibles
          // Cela permet d'afficher au moins les informations de base
          const minimalDossier: Dossier = {
            id: dossierId,
            candidat_id: 'unknown',
            auto_ecole_id: 'unknown',
            formation_id: 'unknown',
            statut: 'en_attente',
            date_creation: new Date().toISOString(),
            date_modification: new Date().toISOString(),
            commentaires: 'Données limitées disponibles',
            candidat: {
              id: 'unknown',
              personne_id: 'unknown',
              numero_candidat: 'N/A',
              date_naissance: 'N/A',
              lieu_naissance: 'N/A',
              nip: 'N/A',
              type_piece: 'N/A',
              numero_piece: 'N/A',
              nationalite: 'N/A',
              genre: 'N/A',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              personne: {
                id: 'unknown',
                nom: 'Non disponible',
                prenom: 'Non disponible',
                nom_complet: 'Non disponible',
                email: 'Non disponible',
                contact: 'Non disponible',
                adresse: 'Non disponible',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            },
            formation: {
              id: 'unknown',
              auto_ecole_id: 'unknown',
              type_permis_id: 'unknown',
              montant: 0,
              montant_formate: 'N/A',
              nom: 'Formation non disponible',
              description: 'Les détails de la formation ne sont pas disponibles',
              duree_jours: 0,
              statut: false,
              statut_libelle: 'Non disponible',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            documents: [], // Aucun document disponible
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          setDossier(minimalDossier);
        }
        
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du dossier:', err);
        
        // Gestion spécifique des erreurs
        if (err.response?.status === 404) {
          setError('Dossier non trouvé. Vérifiez que l\'ID du dossier est correct.');
        } else if (err.response?.status === 403) {
          setError('Vous n\'avez pas les permissions pour consulter ce dossier.');
        } else if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else {
          setError(err.response?.data?.message || 'Erreur lors du chargement des détails du candidat');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDossierDetails();
  }, [dossierId, location.state]);

  // Gestion du retour
  const handleBack = () => {
    navigate(-1);
  };

  // Gestion des documents
  const handleDocumentPreview = (document: any) => {
    setSelectedDocument(document);
    setDocumentPreviewOpen(true);
  };

  const handleDocumentDownload = (document: any) => {
    // Simulation du téléchargement
    console.log('📥 Téléchargement du document:', document.nom_fichier);
    // Ici vous pouvez implémenter la logique de téléchargement réelle
  };

  const handleDocumentPreviewClose = () => {
    setDocumentPreviewOpen(false);
    setSelectedDocument(null);
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  // Obtenir l'icône du statut de document
  const getDocumentStatusIcon = (valide: boolean | undefined, statut: string | undefined) => {
    if (valide) return <CheckCircle color="success" />;
    if (statut === 'rejete') return <Error color="error" />;
    return <Warning color="warning" />;
  };

  // Composants Skeleton pour le chargement transparent
  const CandidateDetailsSkeleton = () => (
    <Fade in={true} timeout={300}>
      <Box sx={{ p: 3 }}>
        {/* Skeleton pour l'en-tête */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={200} height={40} />
        </Box>

        <Grid container spacing={3}>
          {/* Skeleton pour les informations personnelles */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Skeleton variant="circular" width={80} height={80} sx={{ mr: 2 }} />
                  <Box>
                    <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="80%" height={16} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Skeleton pour la formation et documents */}
          <Grid item xs={12} md={6}>
            {/* Skeleton pour la formation */}
            <Card elevation={3} sx={{ mb: 3 }}>
              <CardContent>
                <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                  <Skeleton variant="text" width={200} height={28} />
                </Box>
                <Skeleton variant="text" width="100%" height={20} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid item xs={6} key={i}>
                      <Skeleton variant="text" width="70%" height={16} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="90%" height={20} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Skeleton pour les documents */}
            <Card elevation={3}>
              <CardContent>
                <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  if (loading) {
    return <CandidateDetailsSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Retour
        </Button>
      </Box>
    );
  }

  if (!dossier) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Dossier non trouvé
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />}>
          Retour
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Détails du Candidat
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Informations personnelles */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  {dossier.candidat.personne.prenom[0]}{dossier.candidat.personne.nom[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {dossier.candidat.personne.prenom} {dossier.candidat.personne.nom}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {dossier.candidat.numero_candidat}
                  </Typography>
                  <Chip
                    label={getStatutLabel(dossier.statut)}
                    color={getStatutColor(dossier.statut) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Informations Personnelles
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Email color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={dossier.candidat.personne.email}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Phone color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Téléphone"
                    secondary={dossier.candidat.personne.contact}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Adresse"
                    secondary={dossier.candidat.personne.adresse}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Date de naissance"
                    secondary={formatDate(dossier.candidat.date_naissance)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Lieu de naissance"
                    secondary={dossier.candidat.lieu_naissance}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Badge color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="NIP"
                    secondary={dossier.candidat.nip}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Assignment color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pièce d'identité"
                    secondary={`${dossier.candidat.type_piece} - ${dossier.candidat.numero_piece}`}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Flag color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Nationalité"
                    secondary={dossier.candidat.nationalite}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Person color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Genre"
                    secondary={dossier.candidat.genre === 'M' ? 'Masculin' : 'Féminin'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Formation et documents */}
        <Grid item xs={12} md={6}>
          {/* Formation */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Formation Inscrite
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  {(() => {
                    // Logique d'affichage du nom de formation
                    const formation = dossier.formation;
                    
                    if (!formation) {
                      return 'Formation non disponible';
                    }
                    
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
                      if (typePermis.libelle && typePermis.libelle.trim()) {
                        return `Formation ${typePermis.libelle}`;
                      }
                      if (typePermis.nom && typePermis.nom.trim()) {
                        return `Formation ${typePermis.nom}`;
                      }
                    }
                    
                    // 4. TypePermis alternatif
                    if (formation.typePermis) {
                      const typePermis = formation.typePermis as any;
                      if (typePermis.libelle && typePermis.libelle.trim()) {
                        return `Formation ${typePermis.libelle}`;
                      }
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
              </Box>
              
              {dossier.formation && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {dossier.formation.description}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Type de permis:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {getTypePermisLabel(dossier.formation)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Durée:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {dossier.formation.duree_jours ? `${dossier.formation.duree_jours} jours` : 'Non spécifiée'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Montant:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="primary">
                        {dossier.formation.montant_formate}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Statut:
                      </Typography>
                      <Chip
                        label={dossier.formation.statut_libelle}
                        color={dossier.formation.statut ? 'success' : 'error'}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Type de demande:
                        </Typography>
                        {dossier.type_demande ? (
                          <Chip
                            label={dossier.type_demande.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ) : dossier.type_demande_id ? (
                          <Typography variant="body2" color="text.secondary">
                            Chargement...
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Non spécifié
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documents Téléversés ({dossier.documents?.length || 0})
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Taille</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dossier.documents || []).map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Description color="action" sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {document.nom}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {document.nom_fichier}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getDocumentStatusIcon(document.valide, document.statut || 'en_attente')}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {document.valide_libelle || 'Non validé'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {document.taille_fichier_formate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {document.date_upload ? formatDate(document.date_upload) : 'Non disponible'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleDocumentPreview(document)}
                            title="Prévisualiser"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDocumentDownload(document)}
                            title="Télécharger"
                          >
                            <Download />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {(dossier.documents || []).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Assignment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun document téléversé
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Le candidat n'a pas encore téléversé de documents
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogue de prévisualisation de document */}
      <Dialog
        open={documentPreviewOpen}
        onClose={handleDocumentPreviewClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Prévisualisation: {selectedDocument?.nom}
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fichier: {selectedDocument.nom_fichier}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Taille: {selectedDocument.taille_fichier_formate}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {selectedDocument.type}
              </Typography>
              {selectedDocument.commentaires && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Commentaires: {selectedDocument.commentaires}
                </Typography>
              )}
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Prévisualisation non disponible pour ce type de fichier.
                  Utilisez le bouton de téléchargement pour consulter le document.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDocumentPreviewClose}>
            Fermer
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedDocument) {
                handleDocumentDownload(selectedDocument);
              }
            }}
            startIcon={<Download />}
          >
            Télécharger
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateDetailsPage;
