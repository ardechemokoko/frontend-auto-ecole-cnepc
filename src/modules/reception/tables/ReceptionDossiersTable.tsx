import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceptionDossier, EpreuveStatut, EpreuveAttempt } from '../types';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip, Snackbar, Alert, TableContainer, Paper } from '@mui/material';
import EpreuveSheet from '../components/EpreuveSheet';
import { EyeIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '../../../shared/constants';
import { Description } from '@mui/icons-material';
import axiosClient from '../../../shared/environment/envdev';

interface ReceptionDossiersTableProps {
  dossiers: ReceptionDossier[];
  onReceive: (id: string) => void;
  onOpenDocuments?: (dossier: ReceptionDossier) => void;
}

// Fonctions de calcul du statut (copiées depuis EpreuveSheet)
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

const ReceptionDossiersTable: React.FC<ReceptionDossiersTableProps> = ({ dossiers, onReceive, onOpenDocuments }) => {
  const navigate = useNavigate();
  // État pour stocker les épreuves de chaque dossier
  const [epreuvesMap, setEpreuvesMap] = React.useState<Map<string, EpreuveStatut>>(new Map());

  // Charger les épreuves depuis les données du dossier (depuis l'API) ou calculer depuis /resultats
  React.useEffect(() => {
    const loadEpreuvesStatus = async () => {
      if (dossiers.length === 0) {
        setEpreuvesMap(new Map());
        return;
      }

      const newMap = new Map<string, EpreuveStatut>();
      
      // D'abord, utiliser les épreuves depuis les données du dossier si disponibles
      dossiers.forEach(dossier => {
        if (dossier.epreuves?.general) {
          newMap.set(dossier.id, dossier.epreuves.general);
        }
      });

      // Ensuite, charger les résultats depuis /resultats pour les dossiers sans statut
      const dossiersSansStatut = dossiers.filter(d => !newMap.has(d.id));
      
      if (dossiersSansStatut.length > 0) {
        console.log(`📋 Chargement des statuts d'épreuves pour ${dossiersSansStatut.length} dossier(s)...`);
        
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
              
              // Organiser les résultats par type d'examen
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
              
              // Trier par date
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
              
              // Calculer les statuts
              const creneauxStatus = computeOverall(creneauxAttempts);
              const codeStatus = computeOverall(codeConduiteAttempts);
              const villeStatus = computeOverall(tourVilleAttempts);
              const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
              
              newMap.set(dossier.id, generalStatus);
              console.log(`✅ Statut calculé pour dossier ${dossier.id}: ${generalStatus}`);
            } catch (err: any) {
              // En cas d'erreur (404 = pas de résultats), mettre 'non_saisi'
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

  React.useEffect(() => {
    try {
      // Log compact de la liste
      console.log('📦 ReceptionDossiersTable - dossiers (count):', dossiers?.length || 0);
      // Log détaillé des champs affichés + date examen + statut
      console.table(
        (dossiers || []).map(d => ({
          id: d.id,
          reference: d.reference,
          candidat: `${d.candidatNom} ${d.candidatPrenom}`.trim(),
          autoEcole: d.autoEcoleNom,
          dateExamen: d.dateExamen,
          dateEnvoi: d.dateEnvoi,
          statut: d.statut,
          epreuveGeneral: epreuvesMap.get(d.id) || 'non_saisi',
        }))
      );
      // Log de la réponse brute si disponible
      (dossiers || []).forEach(d => {
        if (d.details) {
          console.log('🔎 programme_session (raw) for', d.id, d.details);
          if ((d as any).details?.dossier_complet) {
            console.log('🧾 dossier_complet for', d.reference, (d as any).details.dossier_complet);
          }
        }
      });
    } catch {}
  }, [dossiers, epreuvesMap]);
  // Utiliser onReceive pour éviter l'avertissement linter si non utilisé
  React.useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onReceive;
    } catch {}
  }, [onReceive]);
  const [openEpreuve, setOpenEpreuve] = React.useState(false);
  const [selected, setSelected] = React.useState<ReceptionDossier | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenEpreuve = (d: ReceptionDossier) => {
    setSelected(d);
    setOpenEpreuve(true);
  };

  const handleOpenDetails = (d: ReceptionDossier) => {
    // Naviguer vers la page de détails du candidat
    // Naviguer vers la page de détails du candidat en utilisant l'ID du dossier (pas la référence)
    navigate(ROUTES.RECEPTION_CANDIDAT_DETAILS.replace(':id', d.id));
  };

  const handleSaved = (results: any) => {
    try {
      console.log('✅ Epreuves enregistrées pour', selected?.reference, results);
      // Mettre à jour le statut des épreuves dans le map
      if (selected && results?.general) {
        setEpreuvesMap(prev => {
          const newMap = new Map(prev);
          newMap.set(selected.id, results.general);
          return newMap;
        });
      }
    } catch {}
  };

  // Fonction pour obtenir le libellé et la couleur du statut des épreuves
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
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Référence
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Candidat
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Formation
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Auto-école
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Date examen
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Date d'envoi
              </TableCell>
              <TableCell sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Statut
              </TableCell>
              <TableCell align="right" sx={{ 
                fontWeight: 700, 
                color: '#1a1a1a', 
                py: 2,
                fontSize: '0.875rem',
                letterSpacing: '0.02em',
                backgroundColor: 'white'
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dossiers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ 
                  py: 6, 
                  textAlign: 'center', 
                  backgroundColor: 'white',
                  border: 'none'
                }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Aucun dossier en attente de réception.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {dossiers.map((dossier) => {
              // Récupérer les informations de formation depuis details
              const formationDetails = dossier.details?.formation_complete || dossier.details?.dossier?.formation;
              const formationNom = formationDetails?.type_permis?.libelle || formationDetails?.nom || 'Formation';
              
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
                    },
                    '&:last-child td': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {dossier.reference}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                      {dossier.candidatNom} {dossier.candidatPrenom}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {formationNom}
                      </Typography>
                      {formationDetails?.description && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          display="block" 
                          sx={{ 
                            mt: 0.5,
                            fontSize: '0.75rem',
                            lineHeight: 1.4
                          }}
                        >
                          {formationDetails.description.substring(0, 40)}...
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                      {dossier.autoEcoleNom}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                      {dossier.dateExamen ? new Date(dossier.dateExamen).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.875rem' }}>
                      {new Date(dossier.dateEnvoi).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    {(() => {
                      const epreuveStatut = epreuvesMap.get(dossier.id) || dossier.epreuves?.general;
                      const statutInfo = getStatutEpreuveInfo(epreuveStatut);
                      return (
                        <Chip
                          label={statutInfo.label}
                          color={statutInfo.color}
                          size="small"
                          variant={epreuveStatut === 'non_saisi' ? 'outlined' : 'filled'}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-label': {
                              px: 1.5
                            }
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    py: 2, 
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EyeIcon className="w-4 h-4" />}
                        onClick={() => handleOpenDetails(dossier)}
                        sx={{
                          textTransform: 'none',
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                          color: '#333',
                          fontWeight: 500,
                          px: 2,
                          py: 0.75,
                          '&:hover': {
                            borderColor: '#1976d2',
                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                            color: '#1976d2'
                          }
                        }}
                      >
                        Détails
                      </Button>
                      {onOpenDocuments && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Description />}
                          onClick={() => onOpenDocuments(dossier)}
                          sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                            color: '#333',
                            fontWeight: 500,
                            px: 2,
                            py: 0.75,
                            '&:hover': {
                              borderColor: '#9c27b0',
                              backgroundColor: 'rgba(156, 39, 176, 0.04)',
                              color: '#9c27b0'
                            }
                          }}
                        >
                          Documents
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenEpreuve(dossier)}
                        sx={{
                          textTransform: 'none',
                          backgroundColor: '#1976d2',
                          fontWeight: 600,
                          px: 2,
                          py: 0.75,
                          boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)'
                          }
                        }}
                      >
                        Épreuves
                      </Button>
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

export default ReceptionDossiersTable;


