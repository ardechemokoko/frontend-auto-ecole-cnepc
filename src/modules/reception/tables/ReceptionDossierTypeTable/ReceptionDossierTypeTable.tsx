import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceptionDossier, EpreuveStatut } from '../../types';
import { 
  Box, 
  Table, 
  TableBody, 
  Snackbar, 
  Alert, 
  TableContainer, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import EpreuveSheet from '../../components/EpreuveSheet';
import { ROUTES } from '../../../../shared/constants';
import { ReceptionDossierTypeTableProps } from './types';
import { useEpreuvesStatus } from './hooks/useEpreuvesStatus';
import { useDossierSuivi } from './hooks/useDossierSuivi';
import { isNouveauPermisType } from './helpers.tsx';
import { TableHeader } from './components/TableHeader';
import { DossierTableRow } from './components/TableRow';
import { EmptyState } from './components/EmptyState';
import axiosClient from '../../../../shared/environment/envdev';

const ReceptionDossierTypeTable: React.FC<ReceptionDossierTypeTableProps> = ({ 
  dossiers, 
  typeDemandeName,
  typeDemandeId,
  circuit: circuitProp,
  onReceive, 
  onOpenDocuments,
  onDelete
}) => {
  const navigate = useNavigate();
  const [openEpreuve, setOpenEpreuve] = React.useState(false);
  const [selected, setSelected] = React.useState<ReceptionDossier | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<{ open: boolean; dossier: ReceptionDossier | null }>({
    open: false,
    dossier: null
  });
  const [deleting, setDeleting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { epreuvesMap, updateEpreuveStatus } = useEpreuvesStatus(dossiers);
  const { suiviMap, loadingSuivi } = useDossierSuivi(dossiers, typeDemandeName, typeDemandeId, circuitProp);

  const isNouveauPermis = React.useMemo(() => {
    return isNouveauPermisType(typeDemandeName, suiviMap);
  }, [typeDemandeName, suiviMap]);

  const handleOpenEpreuve = (d: ReceptionDossier) => {
    setSelected(d);
    setOpenEpreuve(true);
  };

  const handleOpenDetails = (d: ReceptionDossier) => {
    navigate(ROUTES.RECEPTION_CANDIDAT_DETAILS.replace(':id', d.id));
  };

  const handleSaved = (results: any) => {
    try {
      if (selected && results?.general) {
        updateEpreuveStatus(selected.id, results.general);
      }
    } catch {}
  };

  const handleDeleteClick = (dossier: ReceptionDossier) => {
    setDeleteDialog({ open: true, dossier });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.dossier) return;

    setDeleting(true);
    try {
      await axiosClient.delete(`/dossiers/${deleteDialog.dossier.id}`);
      
      setSnackbar({
        open: true,
        message: 'Dossier supprimé avec succès',
        severity: 'success'
      });

      // Appeler le callback si fourni
      if (onDelete) {
        await onDelete(deleteDialog.dossier.id);
      }

      setDeleteDialog({ open: false, dossier: null });
    } catch (error: any) {
      console.error('Erreur lors de la suppression du dossier:', error);
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Erreur lors de la suppression du dossier',
        severity: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, dossier: null });
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
          <TableHeader isNouveauPermis={isNouveauPermis} />
          <TableBody>
            {dossiers.length === 0 && (
              <EmptyState colSpan={isNouveauPermis ? 7 : 5} />
            )}
            {dossiers.map((dossier) => {
              const epreuveStatut = epreuvesMap.get(dossier.id) || dossier.epreuves?.general;
              const suivi = suiviMap.get(dossier.id);
              
              return (
                <DossierTableRow
                  key={dossier.id}
                  dossier={dossier}
                  isNouveauPermis={isNouveauPermis}
                  epreuveStatut={epreuveStatut}
                  suivi={suivi}
                  loadingSuivi={loadingSuivi}
                  onOpenDetails={handleOpenDetails}
                  onOpenDocuments={onOpenDocuments}
                  onOpenEpreuve={handleOpenEpreuve}
                  onDelete={handleDeleteClick}
                />
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
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer le dossier <strong>{deleteDialog.dossier?.reference}</strong> du candidat <strong>{deleteDialog.dossier?.candidatNom} {deleteDialog.dossier?.candidatPrenom}</strong> ?
            <br />
            <br />
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceptionDossierTypeTable;

