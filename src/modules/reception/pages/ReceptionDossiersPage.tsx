import React from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { receptionService } from '../services/reception.service';
import { ReceptionDossier } from '../types';
import ReceptionDossiersTable from '../tables/ReceptionDossiersTable';

const ReceptionDossiersPage: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [dossiers, setDossiers] = React.useState<ReceptionDossier[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDossiers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receptionService.listIncoming();
      setDossiers(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement');
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  const handleReceive = async (id: string) => {
    try {
      await receptionService.receiveDossier(id);
      fetchDossiers();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la réception du dossier');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Réception des dossiers</Typography>
        <Button onClick={fetchDossiers} variant="outlined" size="small">Rafraîchir</Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ReceptionDossiersTable dossiers={dossiers} onReceive={handleReceive} />
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>
      )}
    </Box>
  );
};

export default ReceptionDossiersPage;


