import React from 'react';
import { ReceptionDossier, EpreuveStatut } from '../types';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip, Snackbar, Alert } from '@mui/material';
import EpreuveSheet from '../components/EpreuveSheet';
import CandidatDetailsSheet from '../components/CandidatDetailsSheet';
import { EyeIcon } from '@heroicons/react/24/outline';

interface ReceptionDossiersTableProps {
  dossiers: ReceptionDossier[];
  onReceive: (id: string) => void;
}

const ReceptionDossiersTable: React.FC<ReceptionDossiersTableProps> = ({ dossiers, onReceive }) => {
  // État pour stocker les épreuves de chaque dossier
  const [epreuvesMap, setEpreuvesMap] = React.useState<Map<string, EpreuveStatut>>(new Map());

  // Charger les épreuves depuis les données du dossier (depuis l'API)
  React.useEffect(() => {
    const newMap = new Map<string, EpreuveStatut>();
    dossiers.forEach(dossier => {
      // Utiliser les épreuves depuis les données du dossier
      if (dossier.epreuves?.general) {
        newMap.set(dossier.id, dossier.epreuves.general);
      }
    });
    setEpreuvesMap(newMap);
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
  const [openDetails, setOpenDetails] = React.useState(false);
  const [selected, setSelected] = React.useState<ReceptionDossier | null>(null);
  const [selectedForDetails, setSelectedForDetails] = React.useState<ReceptionDossier | null>(null);
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
    setSelectedForDetails(d);
    setOpenDetails(true);
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
    <Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Référence</TableCell>
            <TableCell>Candidat</TableCell>
            <TableCell>Formation</TableCell>
            <TableCell>Auto-école</TableCell>
            <TableCell>Date examen</TableCell>
            <TableCell>Date d'envoi</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dossiers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography variant="body2">Aucun dossier en attente de réception.</Typography>
              </TableCell>
            </TableRow>
          )}
          {dossiers.map((dossier) => {
            // Récupérer les informations de formation depuis details
            const formationDetails = dossier.details?.formation_complete || dossier.details?.dossier?.formation;
            const formationNom = formationDetails?.type_permis?.libelle || formationDetails?.nom || 'Formation';
            
            return (
              <TableRow key={dossier.id} hover>
                <TableCell>{dossier.reference}</TableCell>
                <TableCell>{dossier.candidatNom} {dossier.candidatPrenom}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formationNom}
                    </Typography>
                    {formationDetails?.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        📝 {formationDetails.description.substring(0, 30)}...
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{dossier.autoEcoleNom}</TableCell>
                <TableCell>{dossier.dateExamen ? new Date(dossier.dateExamen).toLocaleString() : '-'}</TableCell>
                <TableCell>{new Date(dossier.dateEnvoi).toLocaleString()}</TableCell>
                <TableCell>
                  {(() => {
                    const epreuveStatut = epreuvesMap.get(dossier.id) || dossier.epreuves?.general;
                    const statutInfo = getStatutEpreuveInfo(epreuveStatut);
                    return (
                      <Chip
                        label={statutInfo.label}
                        color={statutInfo.color}
                        size="small"
                        variant={epreuveStatut === 'non_saisi' ? 'outlined' : 'filled'}
                      />
                    );
                  })()}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EyeIcon className="w-4 h-4" />}
                      onClick={() => handleOpenDetails(dossier)}
                    >
                      Détails
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenEpreuve(dossier)}
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
      <EpreuveSheet
        open={openEpreuve}
        onClose={() => setOpenEpreuve(false)}
        dossier={selected}
        onSaved={handleSaved}
      />
      <CandidatDetailsSheet
        open={openDetails}
        onClose={() => {
          setOpenDetails(false);
          setSelectedForDetails(null);
        }}
        dossier={selectedForDetails}
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


