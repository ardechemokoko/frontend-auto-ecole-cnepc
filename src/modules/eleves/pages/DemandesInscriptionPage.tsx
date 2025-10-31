import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert
} from '@mui/material';
import DemandesInscriptionTable from '../tables/DemandesInscriptionTable';
import CandidatDetailsSheet from '../components/CandidatDetailsSheet';
// Utiliser le même formulaire d'inscription que dans CNEPC
import { InscriptionFormationForm } from '../../cnepc/forms';
import type { AutoEcole } from '../../cnepc/types/auto-ecole';
import { authService } from '../../auth/services/authService';
import { DemandeInscription } from '../types/inscription';

const DemandesInscriptionPage: React.FC = () => {
  const [selectedCandidat, setSelectedCandidat] = useState<DemandeInscription | null>(null);
  const [inscriptionOpen, setInscriptionOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoEcole, setAutoEcole] = useState<AutoEcole | null>(null);
  const [loadingAutoEcole, setLoadingAutoEcole] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const handleCandidatSelect = (candidat: DemandeInscription) => {
    setSelectedCandidat(candidat);
    setSheetOpen(true);
  };

  const handleCloseInscription = () => {
    setInscriptionOpen(false);
    setSelectedCandidat(null);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedCandidat(null);
  };

  const handleValidationSuccess = (eleveValide: any) => {
    console.log('✅ Demande validée avec succès - l\'élève a été transféré vers StudentsTable:', eleveValide);
    // Rafraîchir la liste des demandes pour cacher la demande validée
    setRefreshTrigger(prev => prev + 1);
    // Note: StudentsTable se rafraîchira automatiquement quand on y navigue
    // car il appelle getElevesValides() qui récupère depuis le stockage local
  };

  const handleDeleteSuccess = () => {
    console.log('Demande supprimée avec succès');
    // Rafraîchir la liste des demandes pour supprimer la demande supprimée
    setRefreshTrigger(prev => prev + 1);
  };

  // Charger l'auto-école du responsable connecté (nécessaire pour le formulaire)
  useEffect(() => {
    const loadAutoEcole = async () => {
      try {
        setLoadingAutoEcole(true);
        // 1) Essayer via les infos déjà stockées au login
        const cached = localStorage.getItem('auto_ecole_info');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id) {
              setAutoEcole(parsed as any);
              return;
            }
          } catch { /* ignore parse error */ }
        }

        // 2) Sinon, récupérer via /auth/me puis rechercher par personne.id
        const token = localStorage.getItem('access_token') || '';
        if (!token) return;
        const me = await authService.getCurrentUser(token);
        const responsablePersonneId = me?.user?.personne?.id;
        if (!responsablePersonneId) return;
        const resp = await authService.findAutoEcoleByResponsableId(responsablePersonneId, token);
        if (resp && resp.data) {
          setAutoEcole(resp.data as any);
        }
      } catch (_e) {
        // noop: l'utilisateur peut ne pas être un responsable auto-école
      } finally {
        setLoadingAutoEcole(false);
      }
    };
    loadAutoEcole();
  }, []);

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: 'gray-100' }}>
      <Typography variant="h4" component="h1" gutterBottom className="font-display p-4">
        Demandes d'inscriptions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} className="font-primary p-4 ">
        Gestion des demandes d'inscription des élèves
      </Typography>

      {/* Bouton pour ouvrir le formulaire d'inscription (même que CNEPC) */}
      <Box className="p-4" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {uiError && (
          <Alert severity="warning" sx={{ mr: 2 }} onClose={() => setUiError(null)}>
            {uiError}
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={() => {
            if (!autoEcole) {
              setUiError('Aucune auto-école associée à votre compte.');
              return;
            }
            setUiError(null);
            setInscriptionOpen(true);
          }}
          
        >
          Inscrire un candidat
        </Button>
      </Box>

      <DemandesInscriptionTable 
        onCandidatSelect={handleCandidatSelect} 
        refreshTrigger={refreshTrigger}
        onDelete={handleDeleteSuccess}
      />
      
      {/* Détails du candidat (sheet) */}
      <CandidatDetailsSheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        candidat={selectedCandidat}
        onValidationSuccess={handleValidationSuccess}
      />
      
      {/* Formulaire d'inscription d'un candidat à une formation (même composant que côté CNEPC) */}
      {autoEcole && (
        <InscriptionFormationForm
          open={inscriptionOpen}
          autoEcole={autoEcole}
          onSuccess={async () => {
            // Rafraîchir les infos d'auto-école en localStorage pour mettre à jour les dossiers
            try {
              const token = localStorage.getItem('access_token') || '';
              if (token && autoEcole?.id) {
                const refreshed = await authService.getAutoEcoleById(autoEcole.id, token);
                if (refreshed?.success && refreshed.data) {
                  localStorage.setItem('auto_ecole_info', JSON.stringify(refreshed.data));
                }
              }
            } catch {}
            setInscriptionOpen(false);
            setRefreshTrigger(prev => prev + 1);
          }}
          onCancel={handleCloseInscription}
        />
      )}
    </Box>
  );
};

export default DemandesInscriptionPage;
