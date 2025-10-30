import React from 'react';
import { ReceptionDossier } from '../types';
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import EpreuveSheet from '../components/EpreuveSheet';

interface ReceptionDossiersTableProps {
  dossiers: ReceptionDossier[];
  onReceive: (id: string) => void;
}

const ReceptionDossiersTable: React.FC<ReceptionDossiersTableProps> = ({ dossiers, onReceive }) => {
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
  }, [dossiers]);
  // Utiliser onReceive pour éviter l'avertissement linter si non utilisé
  React.useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onReceive;
    } catch {}
  }, [onReceive]);
  const [openEpreuve, setOpenEpreuve] = React.useState(false);
  const [selected, setSelected] = React.useState<ReceptionDossier | null>(null);

  const handleOpenEpreuve = (d: ReceptionDossier) => {
    setSelected(d);
    setOpenEpreuve(true);
  };

  const handleSaved = (results: any) => {
    try {
      console.log('✅ Epreuves enregistrées pour', selected?.reference, results);
    } catch {}
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
            const formationMontant = formationDetails?.montant_formate || formationDetails?.montant || 'N/A';
            
            return (
              <TableRow key={dossier.id} hover>
                <TableCell>{dossier.reference}</TableCell>
                <TableCell>{dossier.candidatNom} {dossier.candidatPrenom}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formationNom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      💰 {formationMontant}
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
                <TableCell>{dossier.statut}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenEpreuve(dossier)}
                  >
                    Épreuves
                  </Button>
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
    </Box>
  );
};

export default ReceptionDossiersTable;


