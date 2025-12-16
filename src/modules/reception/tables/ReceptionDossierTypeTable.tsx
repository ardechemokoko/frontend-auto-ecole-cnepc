import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceptionDossier, EpreuveStatut, EpreuveAttempt } from '../types';
import { 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Typography, 
  Chip, 
  Snackbar, 
  Alert, 
  TableContainer, 
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import EpreuveSheet from '../components/EpreuveSheet';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../../shared/constants';
import { Description, Timeline, CheckCircle, Pending, Block } from '@mui/icons-material';
import axiosClient from '../../../shared/environment/envdev';
import { circuitSuiviService, CircuitSuivi } from '../services/circuit-suivi.service';
import { typeDemandeService } from '../../cnepc/services';

interface ReceptionDossierTypeTableProps {
  dossiers: ReceptionDossier[];
  typeDemandeName: string;
  typeDemandeId?: string;
  circuit?: CircuitSuivi | null; // Circuit déjà chargé (optionnel)
  onReceive: (id: string) => void;
  onOpenDocuments?: (dossier: ReceptionDossier) => void;
}

// Fonctions de calcul du statut
const MAX_ATTEMPTS = 3;

function computeOverall(attempts?: EpreuveAttempt[], legacy?: EpreuveStatut): EpreuveStatut {
  if (legacy && legacy !== 'non_saisi') return legacy;
  if (!attempts || attempts.length === 0) return 'non_saisi';
  if (attempts.some(a => a.result === 'reussi')) return 'reussi';
  if (attempts.length >= MAX_ATTEMPTS && attempts.every(a => a.result !== 'reussi')) return 'echoue';
  return attempts[attempts.length - 1].result;
}

function computeGeneral(
  creneaux: EpreuveStatut,
  codeConduite: EpreuveStatut,
  tourVille: EpreuveStatut
): EpreuveStatut {
  const statuses: EpreuveStatut[] = [creneaux, codeConduite, tourVille];
  
  if (statuses.every(s => s === 'reussi')) return 'reussi';
  if (statuses.some(s => s === 'echoue')) return 'echoue';
  if (statuses.some(s => s === 'absent')) return 'absent';
  
  return 'non_saisi';
}

interface DossierSuivi {
  dossierId: string;
  circuit: CircuitSuivi | null;
  currentEtape: string | null;
  progress: number;
  documentsCount: number;
  documentsValides: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

const ReceptionDossierTypeTable: React.FC<ReceptionDossierTypeTableProps> = ({ 
  dossiers, 
  typeDemandeName,
  typeDemandeId,
  circuit: circuitProp,
  onReceive, 
  onOpenDocuments 
}) => {
  const navigate = useNavigate();
  const [epreuvesMap, setEpreuvesMap] = React.useState<Map<string, EpreuveStatut>>(new Map());
  const [suiviMap, setSuiviMap] = React.useState<Map<string, DossierSuivi>>(new Map());
  const [loadingSuivi, setLoadingSuivi] = React.useState(false);
  const [openEpreuve, setOpenEpreuve] = React.useState(false);
  const [selected, setSelected] = React.useState<ReceptionDossier | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Déterminer si c'est un type "NOUVEAU PERMIS" en utilisant le circuit chargé
  const isNouveauPermis = React.useMemo(() => {
    // D'abord, essayer d'utiliser le circuit du suivi (plus fiable)
    if (suiviMap.size > 0) {
      const firstSuivi = Array.from(suiviMap.values())[0];
      if (firstSuivi?.circuit?.nom_entite) {
        const nomEntite = firstSuivi.circuit.nom_entite.toUpperCase();
        return nomEntite.includes('NOUVEAU PERMIS') || nomEntite === 'PERMIS_CONDUIRE';
      }
    }
    // Fallback: utiliser typeDemandeName
    const typeName = (typeDemandeName || '').toUpperCase();
    return typeName.includes('NOUVEAU PERMIS') || typeName === 'PERMIS_CONDUIRE' || typeName.includes('PERMIS');
  }, [typeDemandeName, suiviMap]);

  // Charger les épreuves
  React.useEffect(() => {
    const loadEpreuvesStatus = async () => {
      if (dossiers.length === 0) {
        setEpreuvesMap(new Map());
        return;
      }

      const newMap = new Map<string, EpreuveStatut>();
      
      dossiers.forEach(dossier => {
        if (dossier.epreuves?.general) {
          newMap.set(dossier.id, dossier.epreuves.general);
        }
      });

      const dossiersSansStatut = dossiers.filter(d => !newMap.has(d.id));
      
      if (dossiersSansStatut.length > 0) {
        await Promise.all(
          dossiersSansStatut.map(async (dossier) => {
            try {
              const response = await axiosClient.get('/resultats', {
                params: { dossier_id: dossier.id }
              });
              
              const resultats = Array.isArray(response.data?.data) ? response.data.data : [];
              
              if (resultats.length === 0) {
                newMap.set(dossier.id, 'non_saisi');
                return;
              }
              
              const creneauxAttempts: EpreuveAttempt[] = [];
              const codeConduiteAttempts: EpreuveAttempt[] = [];
              const tourVilleAttempts: EpreuveAttempt[] = [];
              
              resultats.forEach((resultat: any) => {
                const attempt: EpreuveAttempt = {
                  result: resultat.statut as EpreuveStatut,
                  date: resultat.date,
                  note: resultat.commentaire || ''
                };
                
                const typeExamen = (resultat.typeExamen || '').toLowerCase().trim();
                
                if (typeExamen.includes('creneau') || typeExamen === 'creneaux') {
                  creneauxAttempts.push(attempt);
                } else if (typeExamen.includes('code') || typeExamen === 'codeconduite' || typeExamen === 'code_conduite') {
                  codeConduiteAttempts.push(attempt);
                } else if (typeExamen.includes('ville') || typeExamen === 'tourville' || typeExamen === 'tour_ville') {
                  tourVilleAttempts.push(attempt);
                }
              });
              
              creneauxAttempts.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
              });
              codeConduiteAttempts.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
              });
              tourVilleAttempts.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
              });
              
              const creneauxStatus = computeOverall(creneauxAttempts);
              const codeStatus = computeOverall(codeConduiteAttempts);
              const villeStatus = computeOverall(tourVilleAttempts);
              const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
              
              newMap.set(dossier.id, generalStatus);
            } catch (err: any) {
              if (err?.response?.status === 404) {
                newMap.set(dossier.id, 'non_saisi');
              } else {
                console.error(`❌ Erreur lors du chargement des résultats pour dossier ${dossier.id}:`, err);
                newMap.set(dossier.id, 'non_saisi');
              }
            }
          })
        );
      }
      
      setEpreuvesMap(newMap);
    };
    
    loadEpreuvesStatus();
  }, [dossiers]);

  // Charger le suivi pour chaque dossier de manière optimisée
  React.useEffect(() => {
    const loadSuivi = async () => {
      if (dossiers.length === 0) {
        setSuiviMap(new Map());
        return;
      }

      setLoadingSuivi(true);
      const newSuiviMap = new Map<string, DossierSuivi>();

      try {
        // Étape 1: Charger le circuit UNE SEULE FOIS pour tous les dossiers
        // Tous les dossiers de cette table ont le même type de demande
        let circuit: CircuitSuivi | null = null;
        
        console.log('🔍 ReceptionDossierTypeTable - Paramètres reçus:', {
          typeDemandeName,
          typeDemandeId,
          circuitProp: circuitProp ? 'présent' : 'absent',
          nombreDossiers: dossiers.length
        });
        
        // Afficher le premier dossier pour debug
        if (dossiers.length > 0) {
          console.log('📄 JSON complet du premier dossier:', JSON.stringify(dossiers[0], null, 2));
        }
        
        // Si le circuit est déjà passé en prop, l'utiliser directement
        if (circuitProp) {
          circuit = circuitProp;
          // Charger les étapes si elles ne sont pas présentes
          if (circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
            try {
              console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
              const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
              if (etapes.length > 0) {
                circuit.etapes = etapes;
                console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
              }
            } catch (err: any) {
              console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err.message);
            }
          }
          console.log('✅ Circuit utilisé depuis la prop:', JSON.stringify(circuit, null, 2));
        } else {
          // Sinon, charger le circuit
          // Utiliser directement typeDemandeName si disponible (doit être le nom_entite, pas le libelle)
          if (typeDemandeName) {
            try {
              circuit = await circuitSuiviService.getCircuitByNomEntite(typeDemandeName);
              // Charger les étapes si elles ne sont pas présentes
              if (circuit && circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
                try {
                  console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
                  const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
                  if (etapes.length > 0) {
                    circuit.etapes = etapes;
                    console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
                  }
                } catch (err) {
                  console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err);
                }
              }
              console.log('✅ Circuit chargé avec typeDemandeName:', JSON.stringify(circuit, null, 2));
            } catch (err) {
              console.warn('⚠️ Impossible de charger le circuit avec typeDemandeName:', err);
            }
          }
          
          // Sinon, utiliser typeDemandeId si disponible et valide
          if (!circuit && typeDemandeId && typeDemandeId !== 'non_specifie' && typeDemandeId !== 'null' && typeDemandeId !== 'undefined') {
            try {
              const typeDemande = await typeDemandeService.getTypeDemandeById(typeDemandeId);
              console.log('📋 Type de demande chargé:', JSON.stringify(typeDemande, null, 2));
              if (typeDemande?.name) {
                circuit = await circuitSuiviService.getCircuitByNomEntite(typeDemande.name);
                // Charger les étapes si elles ne sont pas présentes
                if (circuit && circuit.id && (!circuit.etapes || circuit.etapes.length === 0)) {
                  try {
                    console.log(`📋 Chargement des étapes pour le circuit ${circuit.id}...`);
                    const etapes = await circuitSuiviService.getEtapesByCircuitId(circuit.id);
                    if (etapes.length > 0) {
                      circuit.etapes = etapes;
                      console.log(`✅ ${etapes.length} étapes chargées pour le circuit ${circuit.libelle}`);
                    }
                  } catch (err) {
                    console.warn(`⚠️ Impossible de charger les étapes pour le circuit ${circuit.id}:`, err);
                  }
                }
                console.log('✅ Circuit chargé avec typeDemandeId:', JSON.stringify(circuit, null, 2));
              }
            } catch (err) {
              // Ignorer silencieusement les erreurs 404 pour éviter le spam dans la console
              if (err && typeof err === 'object' && 'response' in err && (err as any).response?.status !== 404) {
                console.warn('⚠️ Impossible de charger le circuit avec typeDemandeId:', err);
              }
            }
          }
        }
        
        // Afficher le circuit final
        if (circuit) {
          console.log('🎯 Circuit final utilisé:', JSON.stringify(circuit, null, 2));
        } else {
          console.warn('⚠️ Aucun circuit trouvé pour les paramètres:', { typeDemandeName, typeDemandeId });
        }

        // Étape 2: Charger les documents de manière asynchrone et progressive (par batch)
        const BATCH_SIZE = 5; // Charger 5 dossiers à la fois
        const dossiersArray = Array.from(dossiers);
        
        for (let i = 0; i < dossiersArray.length; i += BATCH_SIZE) {
          const batch = dossiersArray.slice(i, i + BATCH_SIZE);
          
          await Promise.all(
            batch.map(async (dossier) => {
              try {
                // Afficher le dossier complet pour debug
                console.log(`📄 JSON complet du dossier ${dossier.id}:`, JSON.stringify(dossier, null, 2));
                
                // Charger les documents du dossier
                const documents = await circuitSuiviService.getDocumentsByDossier(dossier.id);
                
                // Filtrer les documents pour s'assurer qu'ils appartiennent bien à ce dossier
                // Selon DISTINCTION_DOSSIERS_CIRCUIT.md, chaque document doit avoir documentable_id = dossier.id
                const documentsForDossier = documents.filter((doc: any) => {
                  // Si le document a un documentable_id, vérifier qu'il correspond au dossier
                  // Sinon, garder le document (pour compatibilité avec les anciens documents)
                  return !doc.documentable_id || doc.documentable_id === dossier.id;
                });
                
                const documentsValides = documentsForDossier.filter((d: any) => d.valide).length;

                // Calculer la progression
                let progress = 0;
                let currentEtape = null;
                let status: 'pending' | 'in_progress' | 'completed' | 'blocked' = 'pending';

                if (circuit && circuit.etapes && circuit.etapes.length > 0) {
                  const totalEtapes = circuit.etapes.length;
                  
                  // Logique corrigée : utiliser piece_justification_id selon LIAISON_PIECE_DOCUMENT.md
                  // piece.type_document = PieceJustificative.id = piece_justification_id dans les documents
                  const etapesCompletes = circuit.etapes.filter(etape => {
                    // Si l'étape n'a pas de pièces, elle est considérée comme complétée
                    if (!etape.pieces || etape.pieces.length === 0) {
                      return true;
                    }
                    
                    // Vérifier que toutes les pièces ont au moins un document validé
                    return etape.pieces.every(piece => {
                      // Utiliser piece_justification_id en priorité (selon LIAISON_PIECE_DOCUMENT.md)
                      const docsForPiece = documentsForDossier.filter((doc: any) => 
                        doc.piece_justification_id === piece.type_document
                      );
                      
                      // Si aucun document avec piece_justification_id, essayer avec type_document_id (fallback)
                      if (docsForPiece.length === 0) {
                        const docsByType = documentsForDossier.filter((doc: any) => 
                          doc.type_document_id === piece.type_document
                        );
                        return docsByType.length > 0 && docsByType.some((doc: any) => doc.valide);
                      }
                      
                      // Au moins un document doit être validé
                      return docsForPiece.some((doc: any) => doc.valide === true);
                    });
                  }).length;

                  progress = totalEtapes > 0 ? Math.round((etapesCompletes / totalEtapes) * 100) : 0;
                  
                  // Trouver l'étape actuelle (première étape non complétée)
                  const etapeActuelle = circuit.etapes.find(etape => {
                    // Si l'étape n'a pas de pièces, elle est considérée comme complétée
                    if (!etape.pieces || etape.pieces.length === 0) {
                      return false; // Étape complétée, donc pas l'étape actuelle
                    }
                    
                    // Vérifier si toutes les pièces ont au moins un document validé
                    return !etape.pieces.every(piece => {
                      // Utiliser piece_justification_id en priorité
                      const docsForPiece = documentsForDossier.filter((doc: any) => 
                        doc.piece_justification_id === piece.type_document
                      );
                      
                      // Si aucun document avec piece_justification_id, essayer avec type_document_id (fallback)
                      if (docsForPiece.length === 0) {
                        const docsByType = documentsForDossier.filter((doc: any) => 
                          doc.type_document_id === piece.type_document
                        );
                        return docsByType.length > 0 && docsByType.some((doc: any) => doc.valide);
                      }
                      
                      // Au moins un document doit être validé
                      return docsForPiece.some((doc: any) => doc.valide === true);
                    });
                  });

                  currentEtape = etapeActuelle?.libelle || null;
                  
                  if (progress === 100) {
                    status = 'completed';
                  } else if (progress > 0) {
                    status = 'in_progress';
                  } else {
                    status = 'pending';
                  }
                }

                newSuiviMap.set(dossier.id, {
                  dossierId: dossier.id,
                  circuit,
                  currentEtape,
                  progress,
                  documentsCount: documentsForDossier.length, // Utiliser les documents filtrés
                  documentsValides,
                  status
                });
                
                console.log(`✅ Suivi calculé pour dossier ${dossier.id}:`, {
                  totalDocuments: documents.length,
                  documentsForDossier: documentsForDossier.length,
                  documentsValides,
                  progress,
                  currentEtape,
                  status
                });
              } catch (err: any) {
                console.error(`❌ Erreur lors du chargement du suivi pour dossier ${dossier.id}:`, err);
                newSuiviMap.set(dossier.id, {
                  dossierId: dossier.id,
                  circuit,
                  currentEtape: null,
                  progress: 0,
                  documentsCount: 0,
                  documentsValides: 0,
                  status: 'pending'
                });
              }
            })
          );
          
          // Mettre à jour le state progressivement pour améliorer l'UX
          setSuiviMap(new Map(newSuiviMap));
          
          // Petit délai entre les batches pour éviter de surcharger l'API
          if (i + BATCH_SIZE < dossiersArray.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement du circuit:', err);
      } finally {
        setLoadingSuivi(false);
      }
    };

    loadSuivi();
  }, [dossiers, typeDemandeName, typeDemandeId, circuitProp]);

  const handleOpenEpreuve = (d: ReceptionDossier) => {
    setSelected(d);
    setOpenEpreuve(true);
  };

  const handleOpenDetails = (d: ReceptionDossier) => {
    // Naviguer vers la page de détails du candidat en utilisant l'ID du dossier (pas la référence)
    navigate(ROUTES.RECEPTION_CANDIDAT_DETAILS.replace(':id', d.id));
  };

  const handleSaved = (results: any) => {
    try {
      if (selected && results?.general) {
        setEpreuvesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(selected.id, results.general);
          return newMap;
        });
      }
    } catch {}
  };

  const getStatutEpreuveInfo = (statut: EpreuveStatut | undefined) => {
    switch (statut) {
      case 'reussi':
        return { label: 'Validé', color: 'success' as const };
      case 'echoue':
        return { label: 'Échoué', color: 'error' as const };
      case 'absent':
        return { label: 'Absent', color: 'warning' as const };
      case 'non_saisi':
      default:
        return { label: 'Non saisi', color: 'default' as const };
    }
  };

  const getSuiviIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <Timeline color="primary" />;
      case 'blocked':
        return <Block color="error" />;
      default:
        return <Pending color="warning" />;
    }
  };

  const getSuiviColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'blocked':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: 'white', 
      borderRadius: 2, 
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 0, 0, 0.08)'
    }}>
      <TableContainer component={Paper} sx={{ 
        backgroundColor: 'white', 
        boxShadow: 'none',
        borderRadius: 2
      }}>
        <Table sx={{ 
          backgroundColor: 'white',
          '& .MuiTableCell-root': {
            borderColor: 'rgba(0, 0, 0, 0.08)'
          }
        }}>
          <TableHead>
            <TableRow sx={{ 
              backgroundColor: 'white',
              borderBottom: '2px solid rgba(0, 0, 0, 0.12)'
            }}>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                Référence
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                Candidat
              </TableCell>
              {isNouveauPermis ? (
                <>
                  <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                    Formation
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                    Auto-école
                  </TableCell>
                </>
              ) : (
                <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                  Type de permis
                </TableCell>
              )}
              <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                Suivi
              </TableCell>
              {isNouveauPermis && (
                <TableCell sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                  Statut Épreuves
                </TableCell>
              )}
              <TableCell align="right" sx={{ fontWeight: 700, color: '#1a1a1a', py: 2, fontSize: '0.875rem' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dossiers.length === 0 && (
              <TableRow>
                <TableCell colSpan={isNouveauPermis ? 7 : 5} sx={{ py: 6, textAlign: 'center', backgroundColor: 'white', border: 'none' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Aucun dossier pour ce type de demande.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {dossiers.map((dossier) => {
              const formationDetails = dossier.details?.formation_complete || dossier.details?.dossier?.formation;
              const formationNom = formationDetails?.type_permis?.libelle || formationDetails?.nom || 'Formation';
              const epreuveStatut = epreuvesMap.get(dossier.id) || dossier.epreuves?.general;
              const statutInfo = getStatutEpreuveInfo(epreuveStatut);
              const suivi = suiviMap.get(dossier.id);
              
              return (
                <TableRow 
                  key={dossier.id} 
                  hover
                  sx={{ 
                    backgroundColor: 'white',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                      transition: 'background-color 0.2s ease'
                    }
                  }}
                >
                  <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {dossier.reference}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                      {dossier.candidatNom} {dossier.candidatPrenom}
                    </Typography>
                  </TableCell>
                  {isNouveauPermis ? (
                    <>
                      <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {formationNom}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                          {dossier.autoEcoleNom}
                        </Typography>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {suivi?.circuit?.type_permis || 'Non spécifié'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ py: 2, backgroundColor: 'white', minWidth: 200 }}>
                    {loadingSuivi ? (
                      <CircularProgress size={20} />
                    ) : suivi ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {getSuiviIcon(suivi.status)}
                          <Typography variant="caption" fontWeight={600}>
                            {suivi.progress}%
                          </Typography>
                          <Chip 
                            label={suivi.status === 'completed' ? 'Terminé' : 
                                   suivi.status === 'in_progress' ? 'En cours' :
                                   suivi.status === 'blocked' ? 'Bloqué' : 'En attente'}
                            size="small"
                            color={getSuiviColor(suivi.status) as any}
                            variant="outlined"
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={suivi.progress} 
                          sx={{ height: 6, borderRadius: 3 }}
                          color={getSuiviColor(suivi.status) as any}
                        />
                        {suivi.currentEtape && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            {suivi.currentEtape}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {suivi.documentsValides}/{suivi.documentsCount} documents validés
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Chargement...
                      </Typography>
                    )}
                  </TableCell>
                  {isNouveauPermis && (
                    <TableCell sx={{ py: 2, backgroundColor: 'white' }}>
                      <Chip
                        label={statutInfo.label}
                        color={statutInfo.color}
                        size="small"
                        variant={epreuveStatut === 'non_saisi' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 600, fontSize: '0.75rem', height: 24 }}
                      />
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ py: 2, backgroundColor: 'white' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Tooltip title="Voir les détails">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetails(dossier)}
                          sx={{ color: '#1976d2' }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </IconButton>
                      </Tooltip>
                      {onOpenDocuments && (
                        <Tooltip title="Documents et suivi">
                          <IconButton
                            size="small"
                            onClick={() => onOpenDocuments(dossier)}
                            sx={{ color: '#9c27b0' }}
                          >
                            <Description />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isNouveauPermis && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenEpreuve(dossier)}
                          sx={{
                            textTransform: 'none',
                            backgroundColor: '#1976d2',
                            fontWeight: 600,
                            px: 2,
                            py: 0.75
                          }}
                        >
                          Épreuves
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <EpreuveSheet
        open={openEpreuve}
        onClose={() => setOpenEpreuve(false)}
        dossier={selected}
        onSaved={handleSaved}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceptionDossierTypeTable;

