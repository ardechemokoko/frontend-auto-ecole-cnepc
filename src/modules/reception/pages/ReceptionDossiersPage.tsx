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
      // Fusion avec les éléments persistés localement suite aux envois
      let localArr: any[] = [];
      try {
        const raw = localStorage.getItem('reception_incoming');
        localArr = raw ? JSON.parse(raw) : [];
      } catch {}
      const byId: Record<string, any> = {};
      [...localArr, ...data].forEach((item: any) => {
        byId[item.id] = item;
      });
      setDossiers(Object.values(byId) as any);
    } catch (e: any) {
      // Fallback: afficher les éléments locaux même si l'API n'existe pas/404
      try {
        const raw = localStorage.getItem('reception_incoming');
        const localArr = raw ? JSON.parse(raw) : [];
        if (Array.isArray(localArr) && localArr.length > 0) {
          setDossiers(localArr as any);
        }
      } catch {}
      setError(e?.message || 'Erreur lors du chargement');
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
      // MàJ localStorage statut
      try {
        const raw = localStorage.getItem('reception_incoming');
        const arr = raw ? JSON.parse(raw) : [];
        const updated = Array.isArray(arr)
          ? arr.map((x: any) => (x.id === id ? { ...x, statut: 'recu' } : x))
          : [];
        localStorage.setItem('reception_incoming', JSON.stringify(updated));
      } catch {}
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


