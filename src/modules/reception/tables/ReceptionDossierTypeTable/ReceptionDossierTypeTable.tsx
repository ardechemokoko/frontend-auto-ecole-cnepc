import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceptionDossier } from '../../types';
import { 
  Box, 
  Snackbar, 
  Alert, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { EyeIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ROUTES } from '../../../../shared/constants';
import { ReceptionDossierTypeTableProps } from './types';
import { useDossierSuivi } from './hooks/useDossierSuivi';
import { useReferentiels } from './hooks/useReferentiels';
import { isNouveauPermisType, getSuiviColor } from './helpers.tsx';
import axiosClient from '../../../../shared/environment/envdev';

const ReceptionDossierTypeTable: React.FC<ReceptionDossierTypeTableProps> = ({ 
  dossiers, 
  typeDemandeName,
  typeDemandeId,
  circuit: circuitProp,
  onReceive: _onReceive, 
  onOpenDocuments: _onOpenDocuments,
  onDelete
}) => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);
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

  const { suiviMap, loadingSuivi } = useDossierSuivi(dossiers, typeDemandeName, typeDemandeId, circuitProp);
  const { getTypePermisLabel, loadingReferentiels } = useReferentiels(dossiers);

  const isNouveauPermis = React.useMemo(() => {
    return isNouveauPermisType(typeDemandeName, suiviMap);
  }, [typeDemandeName, suiviMap]);

  const handleOpenDetails = (d: ReceptionDossier) => {
    navigate(ROUTES.RECEPTION_CANDIDAT_DETAILS.replace(':id', d.id));
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

  // Gestion de la pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les dossiers à afficher selon la pagination
  const paginatedDossiers = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return dossiers.slice(startIndex, endIndex);
  }, [dossiers, page, rowsPerPage]);

  // Fonction helper pour vérifier si un dossier a été envoyé au CNEDDT
  const isDossierSentToCNEDDT = React.useCallback((dossierId: string) => {
    const storageKey = `cneddt_sent_${dossierId}`;
    return localStorage.getItem(storageKey) === 'true';
  }, []);

  return (
    <Box>
      {dossiers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Aucun dossier pour ce type de demande.
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedDossiers.map((dossier) => {
            const sentToCNEDDT = isDossierSentToCNEDDT(dossier.id);
            // Ne pas charger le suivi si le dossier a été envoyé au CNEDDT
            const suivi = sentToCNEDDT ? null : suiviMap.get(dossier.id);
            const formationDetails = dossier.details?.formation_complete || dossier.details?.dossier?.formation;
            const formationNom = formationDetails?.type_permis?.libelle || formationDetails?.nom || 'Formation';
            const typePermisLabel = getTypePermisLabel(dossier);

            return (
              <Grid item xs={12} sm={6} md={3} key={dossier.id}>
                <Card sx={{ 
                  boxShadow: 'None',
                  borderRadius: 'none',
                  '&:hover': {
                    boxShadow: ' None',
                    transition: 'box-shadow 0.3s ease'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                          {dossier.reference}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                          {dossier.candidatNom} {dossier.candidatPrenom}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {sentToCNEDDT ? (
                            <Chip
                              label="Envoyé CNEDDT"
                              size="medium"
                              color="success"
                              variant="filled"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : loadingSuivi ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="caption" color="text.secondary">
                                Chargement...
                              </Typography>
                            </Box>
                          ) : suivi ? (
                            <Chip
                              label={`${suivi.progress}%`}
                              size="medium"
                              color={getSuiviColor(suivi.status) as any}
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : null}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title="Voir les détails">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(dossier)}
                            sx={{ color: '#1976d2' }}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        {onDelete && (
                          <Tooltip title="Supprimer le dossier">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(dossier)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                      {isNouveauPermis ? (
                        <>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Formation
                            </Typography>
                            <Typography variant="body1" fontWeight={600} color="primary.main">
                              {formationNom}
                            </Typography>
                            {formationDetails?.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {formationDetails.description}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Auto-école
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {dossier.autoEcoleNom}
                            </Typography>
                          </Grid>
                        </>
                      ) : (
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Type de permis
                          </Typography>
                          {loadingReferentiels ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                Chargement...
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body1" fontWeight={600} color="primary.main">
                              {typePermisLabel}
                            </Typography>
                          )}
                        </Grid>
                      )}
                      
                      {sentToCNEDDT && (
                        <Grid item xs={12}>
                          <Alert 
                            severity="success" 
                            icon={<CheckCircleIcon className="w-5 h-5" />}
                            sx={{ width: '100%' }}
                          >
                            <Typography variant="body1" fontWeight="bold" className="font-display" gutterBottom>
                              DOSSIER ENVOYÉ POUR IMPRESSION DE LA CARTE
                            </Typography>
                            <Typography variant="body2" className="font-primary">
                              Le dossier a été envoyé avec succès à la CNEDDT pour l'impression de la carte.
                            </Typography>
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          </Grid>
          
          <TablePagination
            component="div"
            count={dossiers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[15, 30, 45, 60]}
            labelRowsPerPage="Dossiers par page:"
            sx={{ mt: 3 }}
          />
        </>
      )}
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

