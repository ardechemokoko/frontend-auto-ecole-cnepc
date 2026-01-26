import React, { lazy, Suspense } from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Typography, 
  TextField, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Skeleton,
  Fade
} from '@mui/material';
import { Search, Refresh, Close } from '@mui/icons-material';
import axiosClient from '../../../shared/environment/envdev';
import { receptionService } from '../services/reception.service';
import { ReceptionDossier } from '../types';
import { circuitSuiviService, CircuitSuivi } from '../services/circuit-suivi.service';
import { typeDemandeService } from '../../cnepc/services';
import { TypeDemande } from '../../cnepc/types/type-demande';

// Lazy loading des composants
const ReceptionDossierTypeTable = lazy(() => import('../tables/ReceptionDossierTypeTable'));
const CircuitEtapesView = lazy(() => import('../components/CircuitEtapesView'));

// Composants Skeleton pour le chargement transparent
const ReceptionDossierTableSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="30%" height={40} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </CardContent>
    </Card>
  </Fade>
);

const CircuitEtapesViewSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Box>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    </Box>
  </Fade>
);

const MainContentSkeleton = () => (
  <Fade in={true} timeout={300}>
    <Box>
      {/* Skeleton pour les onglets */}
      <Paper sx={{ mb: 3, borderRadius: 0 }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        </Box>
      </Paper>
      
      {/* Skeleton pour le tableau */}
      <ReceptionDossierTableSkeleton />
    </Box>
  </Fade>
);

const ReceptionDossiersPage: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [dossiers, setDossiers] = React.useState<ReceptionDossier[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [circuits, setCircuits] = React.useState<CircuitSuivi[]>([]);
  const [selectedTypeDemandeTab, setSelectedTypeDemandeTab] = React.useState<string>('');
  const [circuitCache, setCircuitCache] = React.useState<Map<string, CircuitSuivi>>(new Map());
  const [typeDemandeCache, setTypeDemandeCache] = React.useState<Map<string, TypeDemande>>(new Map());
  // Utiliser useRef pour éviter la dépendance circulaire
  const typeDemandeCacheRef = React.useRef<Map<string, TypeDemande>>(new Map());
  
  // États pour la gestion des documents connexes
  const [selectedDossierForDocuments, setSelectedDossierForDocuments] = React.useState<ReceptionDossier | null>(null);
  const [circuit, setCircuit] = React.useState<CircuitSuivi | undefined>(undefined);
  const [loadingCircuit, setLoadingCircuit] = React.useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = React.useState(false);

  // État pour suivre quels circuits ont leurs étapes chargées
  const [circuitsWithEtapesLoaded, setCircuitsWithEtapesLoaded] = React.useState<Set<string>>(new Set());
  
  // Refs pour éviter les dépendances circulaires
  const circuitsRef = React.useRef<CircuitSuivi[]>([]);
  const circuitCacheRef = React.useRef<Map<string, CircuitSuivi>>(new Map());
  const hasLoadedCircuitsRef = React.useRef(false);
  const hasLoadedDossiersRef = React.useRef(false);

  // Charger uniquement les circuits de base (sans étapes) au début
  const loadCircuits = React.useCallback(async () => {
    if (hasLoadedCircuitsRef.current) {
      return; // Déjà chargé
    }
    
    try {
      console.log('📋 Chargement des circuits actifs (sans étapes)...');
      const circuitsData = await circuitSuiviService.getCircuitsActifs();
      
      // Ne pas charger les étapes ici - elles seront chargées à la demande
      setCircuits(circuitsData);
      circuitsRef.current = circuitsData;
      
      // Mettre à jour le cache avec les circuits de base
      const newCache = new Map<string, CircuitSuivi>();
      circuitsData.forEach(circuit => {
        if (circuit.id) {
          newCache.set(circuit.id, circuit);
        }
        // Aussi indexer par nom_entite pour faciliter la recherche
        if (circuit.nom_entite) {
          newCache.set(circuit.nom_entite, circuit);
        }
      });
      setCircuitCache(newCache);
      circuitCacheRef.current = newCache;
      hasLoadedCircuitsRef.current = true;
      console.log('✅ Circuits de base chargés:', circuitsData.length);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des circuits:', err);
      // Ne pas bloquer l'application si les circuits ne se chargent pas
      setCircuits([]);
      setCircuitCache(new Map());
    }
  }, []);

  // Charger les étapes d'un circuit uniquement quand nécessaire
  const loadCircuitEtapes = React.useCallback(async (circuitId: string) => {
    // Si les étapes sont déjà chargées, ne pas recharger
    if (circuitsWithEtapesLoaded.has(circuitId)) {
      return;
    }

    try {
      console.log(`📋 Chargement des étapes pour le circuit ${circuitId}...`);
      const etapes = await circuitSuiviService.getEtapesByCircuitId(circuitId);
      
      // Mettre à jour le circuit dans le state et le cache
      setCircuits(prevCircuits => {
        return prevCircuits.map(circuit => {
          if (circuit.id === circuitId) {
            const updatedCircuit = { ...circuit, etapes };
            // Mettre à jour le cache
            setCircuitCache(prevCache => {
              const newCache = new Map(prevCache);
              if (circuit.id) {
                newCache.set(circuit.id, updatedCircuit);
              }
              if (circuit.nom_entite) {
                newCache.set(circuit.nom_entite, updatedCircuit);
              }
              return newCache;
            });
            return updatedCircuit;
          }
          return circuit;
        });
      });
      
      // Marquer comme chargé
      setCircuitsWithEtapesLoaded(prev => new Set(prev).add(circuitId));
      
      if (etapes.length > 0) {
        console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuitId}`);
      }
    } catch (err: any) {
      console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuitId}:`, err.message);
    }
  }, [circuitsWithEtapesLoaded]);

  const fetchDossiers = React.useCallback(async () => {
    if (hasLoadedDossiersRef.current) {
      return; // Déjà chargé
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('📋 Chargement des dossiers depuis /dossiers...');
      
      // Récupérer TOUS les dossiers depuis /dossiers (sans filtre)
      const response = await axiosClient.get('/dossiers');
      
      // Gérer les différents formats de réponse
      let dossiersRaw: any[] = [];
      if (Array.isArray(response.data)) {
        dossiersRaw = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        dossiersRaw = response.data.data;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        dossiersRaw = response.data.data;
      }
      
      console.log('📦 Dossiers bruts récupérés:', dossiersRaw.length);
      
      // Étape 1: Récupérer tous les types de demande uniques
      const typeDemandeIds = new Set<string>();
      dossiersRaw.forEach(d => {
        if (d.type_demande_id) {
          typeDemandeIds.add(d.type_demande_id);
        }
      });
      
      console.log('📋 Types de demande à charger:', typeDemandeIds.size);
      
      // Charger les types de demande manquants
      // Utiliser le ref pour éviter la dépendance circulaire
      const newTypeDemandeCache = new Map(typeDemandeCacheRef.current);
      
      // Charger les types de demande manquants
      await Promise.all(
        Array.from(typeDemandeIds).map(async (typeDemandeId) => {
          if (!newTypeDemandeCache.has(typeDemandeId)) {
            try {
              const typeDemande = await typeDemandeService.getTypeDemandeById(typeDemandeId);
              newTypeDemandeCache.set(typeDemandeId, typeDemande);
              console.log(`✅ Type de demande chargé: ${typeDemande.name} (${typeDemandeId})`);
            } catch (err) {
              console.warn(`⚠️ Impossible de charger le type de demande ${typeDemandeId}:`, err);
            }
          }
        })
      );
      
      // Mettre à jour le ref et le state
      typeDemandeCacheRef.current = newTypeDemandeCache;
      setTypeDemandeCache(newTypeDemandeCache);
      
      // Utiliser les refs pour éviter les dépendances
      const currentCircuits = circuitsRef.current;
      const currentCircuitCache = circuitCacheRef.current;
      
      // Transformer les dossiers bruts en ReceptionDossier
      // Enrichir avec les informations du circuit basé sur type_demande_id -> type_demande.name -> circuit.nom_entite
      const enrichedDossiers = await Promise.all(
        dossiersRaw.map(async (dossierRaw) => {
          // Trouver le circuit correspondant via type_demande_id -> type_demande.name -> circuit.nom_entite
          let circuitForDossier: CircuitSuivi | null = null;
          
          if (dossierRaw.type_demande_id) {
            // Récupérer le type de demande
            const typeDemande = newTypeDemandeCache.get(dossierRaw.type_demande_id);
            
            if (typeDemande && typeDemande.name) {
              const nomEntite = typeDemande.name;
              
              // Chercher le circuit correspondant via nom_entite (utiliser les refs)
              circuitForDossier = currentCircuits.find(c => c.nom_entite === nomEntite) || null;
              
              // Si pas trouvé dans les circuits chargés, chercher dans le cache
              if (!circuitForDossier) {
                circuitForDossier = currentCircuitCache.get(nomEntite) || null;
              }
              
              // Si toujours pas trouvé, essayer de le charger (sans étapes)
              if (!circuitForDossier) {
                try {
                  circuitForDossier = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
                  if (circuitForDossier) {
                    // Ne pas charger les étapes ici - elles seront chargées à la demande
                    if (circuitForDossier.nom_entite) {
                      circuitCacheRef.current.set(circuitForDossier.nom_entite, circuitForDossier);
                      setCircuitCache(prev => new Map(prev).set(circuitForDossier!.nom_entite, circuitForDossier!));
                    }
                    if (circuitForDossier.id) {
                      circuitCacheRef.current.set(circuitForDossier.id, circuitForDossier);
                      setCircuitCache(prev => new Map(prev).set(circuitForDossier!.id!, circuitForDossier!));
                    }
                    // Ajouter au state circuits si pas déjà présent
                    if (!currentCircuits.find(c => c.id === circuitForDossier!.id)) {
                      circuitsRef.current = [...currentCircuits, circuitForDossier];
                      setCircuits(prev => {
                        if (!prev.find(c => c.id === circuitForDossier!.id)) {
                          return [...prev, circuitForDossier!];
                        }
                        return prev;
                      });
                    }
                  }
                } catch (err) {
                  console.warn(`⚠️ Circuit non trouvé pour nom_entite: ${nomEntite}`);
                }
              }
            }
          }
          
          // Transformer en ReceptionDossier
          const receptionDossier: ReceptionDossier = {
            id: dossierRaw.id,
            reference: dossierRaw.reference || `DOS-${dossierRaw.id.substring(0, 8).toUpperCase()}`,
            candidatNom: dossierRaw.candidat?.personne?.nom || dossierRaw.candidat_nom || 'N/A',
            candidatPrenom: dossierRaw.candidat?.personne?.prenom || dossierRaw.candidat_prenom || 'N/A',
            autoEcoleNom: dossierRaw.auto_ecole?.nom_auto_ecole || dossierRaw.auto_ecole_nom || 'N/A',
            dateEnvoi: dossierRaw.date_creation || dossierRaw.created_at || new Date().toISOString(),
            statut: (dossierRaw.statut || 'en_attente') as ReceptionDossier['statut'],
            details: {
              dossier_complet: dossierRaw,
              formation_complete: dossierRaw.formation,
              candidat_complet: dossierRaw.candidat
            },
            epreuves: dossierRaw.epreuves || { general: 'non_saisi' }
          };
          
          // Ajouter le circuit au dossier complet
          if (circuitForDossier && receptionDossier.details?.dossier_complet) {
            (receptionDossier.details.dossier_complet as any).circuit = circuitForDossier;
            (receptionDossier.details.dossier_complet as any).type_demande = newTypeDemandeCache.get(dossierRaw.type_demande_id);
          }
          
          return receptionDossier;
        })
      );
      
      console.log('✅ Dossiers enrichis:', enrichedDossiers.length);
      setDossiers(enrichedDossiers);
      hasLoadedDossiersRef.current = true;
    } catch (e: any) {
      console.error('❌ Erreur lors du chargement des dossiers:', e);
      setError(e?.message || 'Erreur lors du chargement');
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  }, []); // Plus de dépendances - utilise les refs

  // Charger les circuits une seule fois au montage
  React.useEffect(() => {
    loadCircuits().then(() => {
      // Charger les dossiers après que les circuits soient chargés
      fetchDossiers();
    });
  }, []); // Tableau de dépendances vide - exécuté une seule fois

  const handleReceive = async (id: string) => {
    try {
      await receptionService.receiveDossier(id);
      // Recharger les données depuis l'API (base de données)
      fetchDossiers();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la réception du dossier');
    }
  };

  // Gérer l'ouverture du dialog des documents connexes
  const handleOpenDocumentsDialog = async (dossier: ReceptionDossier) => {
    setSelectedDossierForDocuments(dossier);
    setDocumentsDialogOpen(true);
    setLoadingCircuit(true);

    try {
      // Déterminer le nom_entite du circuit (par défaut PERMIS_CONDUIRE)
      const nomEntite = 'PERMIS_CONDUIRE';
      
      // Vérifier d'abord le cache
      let circuitData = circuitCache.get(nomEntite);
      
      if (!circuitData) {
        // Charger le circuit correspondant
        const loadedCircuit = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
        if (loadedCircuit) {
          // Charger les étapes si elles ne sont pas présentes
          if (loadedCircuit.id && (!loadedCircuit.etapes || loadedCircuit.etapes.length === 0)) {
            try {
              const etapes = await circuitSuiviService.getEtapesByCircuitId(loadedCircuit.id);
              if (etapes.length > 0) {
                loadedCircuit.etapes = etapes;
                console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${loadedCircuit.libelle}`);
              }
            } catch (err) {
              console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${loadedCircuit.id}:`, err);
            }
          }
          circuitData = loadedCircuit;
          if (circuitData.id) {
            setCircuitCache(prev => new Map(prev).set(nomEntite, circuitData!));
            if (circuitData.id) {
              setCircuitCache(prev => new Map(prev).set(circuitData!.id!, circuitData!));
            }
          }
        }
      }
      
      if (circuitData) {
        setCircuit(circuitData);
      } else {
        console.warn('⚠️ Aucun circuit trouvé pour nom_entite:', nomEntite);
        setCircuit(undefined);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement du circuit:', err);
      setError('Erreur lors du chargement du circuit');
    } finally {
      setLoadingCircuit(false);
    }
  };

  const handleCloseDocumentsDialog = () => {
    setDocumentsDialogOpen(false);
    setSelectedDossierForDocuments(null);
    setCircuit(undefined);
  };

  // Filtrer les dossiers
  const filteredDossiers = React.useMemo(() => {
    let filtered = dossiers;

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(dossier => 
        dossier.candidatNom.toLowerCase().includes(searchLower) ||
        dossier.candidatPrenom.toLowerCase().includes(searchLower) ||
        dossier.reference.toLowerCase().includes(searchLower) ||
        dossier.autoEcoleNom.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [dossiers, searchTerm]);

  // Calculer les statistiques
  const statistics = React.useMemo(() => {
    const total = dossiers.length;
    const recu = dossiers.filter(d => d.statut === 'recu').length;
    const enAttente = dossiers.filter(d => d.statut === 'en_attente' || d.statut === 'transmis' || d.statut === 'Cnepc').length;
    const valide = dossiers.filter(d => d.statut === 'valide').length;

    // Statistiques par circuit
    const parCircuit = new Map<string, number>();
    dossiers.forEach(() => {
      // Pour l'instant, on groupe par nom_entite par défaut (PERMIS_CONDUIRE)
      // Vous pouvez adapter cette logique selon votre structure de données
      const nomEntite = 'PERMIS_CONDUIRE';
      const circuit = circuitCache.get(nomEntite);
      const circuitName = circuit?.libelle || 'Circuit non défini';
      parCircuit.set(circuitName, (parCircuit.get(circuitName) || 0) + 1);
    });

    return {
      total,
      recu,
      enAttente,
      valide,
      parCircuit: Object.fromEntries(parCircuit)
    };
  }, [dossiers, circuitCache]);

  // Grouper les dossiers par circuit
  const dossiersParCircuit = React.useMemo(() => {
    const grouped = new Map<string, { circuit: CircuitSuivi; dossiers: ReceptionDossier[] }>();
    
    console.log('📊 Groupement des dossiers par circuit:', {
      totalDossiers: filteredDossiers.length,
      circuitsCount: circuits.length
    });
    
    filteredDossiers.forEach((dossier) => {
      const dossierComplet = dossier.details?.dossier_complet || dossier.details?.dossier;
      const typeDemandeId = dossierComplet?.type_demande_id;
      
      let circuitForDossier: CircuitSuivi | null = null;
      
      if (typeDemandeId) {
        // Récupérer le type de demande
        const typeDemande = typeDemandeCache.get(typeDemandeId);
        
        if (typeDemande && typeDemande.name) {
          const nomEntite = typeDemande.name;
          
          // Chercher le circuit correspondant via nom_entite
          circuitForDossier = circuits.find(c => c.nom_entite === nomEntite) || null;
          
          // Si pas trouvé, chercher dans le cache
          if (!circuitForDossier) {
            circuitForDossier = circuitCache.get(nomEntite) || null;
          }
        }
      }
      
      // Utiliser le circuit du dossier si disponible (déjà enrichi)
      if (!circuitForDossier && (dossierComplet as any)?.circuit) {
        circuitForDossier = (dossierComplet as any).circuit;
      }
      
      // Si aucun circuit trouvé et qu'un seul circuit est disponible, l'utiliser par défaut
      // (AVANT de créer "non_specifie")
      if (!circuitForDossier && circuits.length === 1) {
        circuitForDossier = circuits[0];
        console.log(`📌 Utilisation du circuit par défaut (unique disponible):`, {
          id: circuitForDossier.id,
          libelle: circuitForDossier.libelle,
          nom_entite: circuitForDossier.nom_entite,
          etapesCount: circuitForDossier.etapes?.length || 0
        });
        
        // S'assurer que les étapes sont chargées
        if (circuitForDossier.id && (!circuitForDossier.etapes || circuitForDossier.etapes.length === 0)) {
          console.warn(`⚠️ Circuit par défaut sans étapes, elles devraient être chargées dans loadCircuits()`);
        }
      }
      
      // Utiliser le circuit trouvé ou créer "non_specifie" seulement si vraiment aucun circuit n'est disponible
      if (circuitForDossier && circuitForDossier.id && circuitForDossier.id !== 'non_specifie') {
        const circuitKey = circuitForDossier.id;
        
        if (!grouped.has(circuitKey)) {
          grouped.set(circuitKey, {
            circuit: circuitForDossier,
            dossiers: []
          });
        }
        
        grouped.get(circuitKey)!.dossiers.push(dossier);
      } else {
        // Dossier sans circuit assigné - grouper dans "Non spécifié" seulement si aucun circuit n'est disponible
        const defaultKey = 'non_specifie';
        if (!grouped.has(defaultKey)) {
          grouped.set(defaultKey, {
            circuit: {
              id: 'non_specifie',
              libelle: 'Non spécifié',
              nom_entite: typeDemandeId || 'N/A',
              actif: true
            } as CircuitSuivi,
            dossiers: []
          });
        }
        grouped.get(defaultKey)!.dossiers.push(dossier);
      }
    });

    console.log('✅ Dossiers groupés par circuit:', Array.from(grouped.entries()).map(([, data]) => ({
      circuit: data.circuit.libelle,
      circuitId: data.circuit.id,
      nom_entite: data.circuit.nom_entite,
      etapesCount: data.circuit.etapes?.length || 0,
      count: data.dossiers.length
    })));

    return grouped;
  }, [filteredDossiers, circuitCache, circuits, typeDemandeCache]);

  // Initialiser le premier onglet si disponible et charger ses étapes
  React.useEffect(() => {
    if (dossiersParCircuit.size > 0 && !selectedTypeDemandeTab) {
      const firstCircuitKey = Array.from(dossiersParCircuit.keys())[0];
      setSelectedTypeDemandeTab(firstCircuitKey);
      
      // Charger les étapes du premier circuit
      const firstCircuitData = dossiersParCircuit.get(firstCircuitKey);
      if (firstCircuitData?.circuit?.id) {
        loadCircuitEtapes(firstCircuitData.circuit.id);
      }
    }
  }, [dossiersParCircuit, selectedTypeDemandeTab, loadCircuitEtapes]);

  // Gestion du changement d'onglet de type de demande
  const handleTypeDemandeTabChange = React.useCallback((_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTypeDemandeTab(newValue);
    
    // Charger les étapes du circuit de l'onglet sélectionné
    const circuitData = dossiersParCircuit.get(newValue);
    if (circuitData?.circuit?.id) {
      loadCircuitEtapes(circuitData.circuit.id);
    }
  }, [dossiersParCircuit, loadCircuitEtapes]);

  // Obtenir les dossiers du type de demande sélectionné
  // S'assurer que selectedTypeDemandeTab est valide, sinon utiliser le premier circuit disponible
  const validSelectedTab = React.useMemo(() => {
    if (selectedTypeDemandeTab && dossiersParCircuit.has(selectedTypeDemandeTab)) {
      return selectedTypeDemandeTab;
    }
    if (dossiersParCircuit.size > 0) {
      const firstKey = Array.from(dossiersParCircuit.keys())[0];
      // Mettre à jour le state si nécessaire (mais pas dans le render, donc on retourne juste la valeur)
      return firstKey;
    }
    return '';
  }, [selectedTypeDemandeTab, dossiersParCircuit]);

  // Synchroniser validSelectedTab avec selectedTypeDemandeTab si différent
  React.useEffect(() => {
    if (validSelectedTab && validSelectedTab !== selectedTypeDemandeTab) {
      setSelectedTypeDemandeTab(validSelectedTab);
    }
  }, [validSelectedTab, selectedTypeDemandeTab]);

  const currentTypeDemandeData = validSelectedTab ? dossiersParCircuit.get(validSelectedTab) : null;

  return (
    <Box sx={{ p: 2 }}>
      {/* En-tête */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Réception des dossiers</Typography>
        <Button 
          onClick={fetchDossiers} 
          variant="outlined" 
          size="small"
          startIcon={<Refresh />}
        >
          Rafraîchir
        </Button>
      </Stack>

      {/* Cartes statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {statistics.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Reçus
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {statistics.recu}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                En attente
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {statistics.enAttente}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Validés
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {statistics.valide}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barre de recherche */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Rechercher par nom, prénom, référence ou auto-école..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </CardContent>
      </Card>

      {/* Onglets pour chaque type de demande */}
      {loading ? (
        <MainContentSkeleton />
      ) : (
        <Box>
          {dossiersParCircuit.size > 0 ? (
            <>
              <Paper sx={{ mb: 3, borderRadius: 0 }}>
                <Tabs
                  value={validSelectedTab || false}
                  onChange={handleTypeDemandeTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    borderRadius: 0,
                    '& .MuiTab-root': {
                      borderRadius: 0
                    },
                    '& .MuiTabs-indicator': {
                      borderRadius: 0
                    }
                  }}
                >
                  {Array.from(dossiersParCircuit.entries()).map(([circuitKey, { circuit, dossiers: dossiersDuCircuit }]) => (
                    <Tab
                      key={circuitKey}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {circuit.libelle}
                          </Typography>
                          <Chip 
                            label={dossiersDuCircuit.length} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </Box>
                      }
                      value={circuitKey}
                      sx={{ borderRadius: 0 }}
                    />
                  ))}
                </Tabs>
              </Paper>

              {/* Affichage des dossiers du type de demande sélectionné */}
              {currentTypeDemandeData ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                      {currentTypeDemandeData.circuit.libelle}
                    </Typography>
                    {currentTypeDemandeData.circuit.nom_entite && (
                      <Chip 
                        label={currentTypeDemandeData.circuit.nom_entite} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    )}
                    <Chip 
                      label={`${currentTypeDemandeData.dossiers.length} dossier(s)`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    {!currentTypeDemandeData.circuit.actif && (
                      <Chip 
                        label="Inactif" 
                        size="small" 
                        color="default" 
                        variant="outlined"
                      />
                    )}
                    {currentTypeDemandeData.circuit.etapes && currentTypeDemandeData.circuit.etapes.length > 0 && (
                      <Chip 
                        label={`${currentTypeDemandeData.circuit.etapes.length} étape(s)`} 
                        size="small" 
                        color="info" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Suspense fallback={<ReceptionDossierTableSkeleton />}>
                    <ReceptionDossierTypeTable 
                      dossiers={currentTypeDemandeData.dossiers} 
                      typeDemandeName={currentTypeDemandeData.circuit.nom_entite || currentTypeDemandeData.circuit.libelle}
                      typeDemandeId={currentTypeDemandeData.circuit.id}
                      circuit={currentTypeDemandeData.circuit}
                      onReceive={handleReceive}
                      onOpenDocuments={handleOpenDocumentsDialog}
                    />
                  </Suspense>
                </Box>
              ) : (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Sélectionnez un type de demande pour afficher les dossiers.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {dossiers.length === 0 
                    ? 'Aucun dossier trouvé. Cliquez sur "Rafraîchir" pour charger les dossiers.'
                    : 'Aucun dossier ne correspond aux filtres sélectionnés.'}
                </Typography>
                {dossiers.length > 0 && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setSearchTerm('');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Réinitialiser la recherche
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>
      )}

      {/* Dialog pour les documents connexes */}
      <Dialog
        open={documentsDialogOpen}
        onClose={handleCloseDocumentsDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Documents connexes - {selectedDossierForDocuments?.candidatNom} {selectedDossierForDocuments?.candidatPrenom}
            </Typography>
            <IconButton onClick={handleCloseDocumentsDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingCircuit ? (
            <CircuitEtapesViewSkeleton />
          ) : circuit ? (
            <Suspense fallback={<CircuitEtapesViewSkeleton />}>
              <CircuitEtapesView
                circuit={circuit}
                dossierId={selectedDossierForDocuments?.id}
                onEtapeChange={(etape) => {
                  console.log('Étape changée:', etape);
                }}
              />
            </Suspense>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Aucun circuit trouvé pour ce dossier.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReceptionDossiersPage;


