import React from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { ArrowBack, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCreateDossier } from '../../contexts/CreateDossierContext';
import { FinalisationStep } from '../../forms/steps';
import { useReferentiels } from '../../forms/hooks';
import { autoEcoleService, gestionDossierService, AutoEcole } from '../../services';

interface FinalisationPageProps {
  onBack: () => void;
}

const FinalisationPage: React.FC<FinalisationPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const {
    candidatId,
    typeDemandeId,
    isNouveauPermis,
    permisData,
    numeroPermis,
    numeroPermisParts,
    permisFormat,
    isFicheEnregistre,
    selectedTypeDemande,
    selectedAutoEcole,
    formationData,
    permisBOrigineData,
    setLoading,
    setError,
    setSuccess,
    setFormationData,
    error,
    success,
    loading,
    resetForm,
  } = useCreateDossier();

  const { referentiels, loadingReferentiels, loadReferentiels } = useReferentiels();

  React.useEffect(() => {
    loadReferentiels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!candidatId) {
      setError('Erreur: Candidat non créé');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dossierPayload: any = {
        candidat_id: candidatId,
        type_demande_id: typeDemandeId,
        statut: 'en_attente',
        date_creation: today,
        commentaires: formationData.commentaires || undefined,
      };

      // Ajouter les informations du permis si ce n'est pas un nouveau permis
      if (!isNouveauPermis) {
        const numPermis = permisData.numero_permis || numeroPermis;
        if (numPermis) {
          if (isFicheEnregistre) {
            dossierPayload.numero_origine_permis = numPermis;
          } else {
            dossierPayload.numero_permis = numPermis;
          }
        }
        
        if (permisData.numero_origine_permis && permisData.numero_origine_permis.trim() !== '') {
          dossierPayload.numero_origine_permis = permisData.numero_origine_permis;
        }
        
        if (permisData.lieu_de_dobtention_du_permis && permisData.lieu_de_dobtention_du_permis.trim() !== '') {
          dossierPayload.lieu_de_dobtention_du_permis = permisData.lieu_de_dobtention_du_permis;
        }
        
        if (permisData.date_de_dobtention_du_permis) {
          const dateObtention = new Date(permisData.date_de_dobtention_du_permis);
          dossierPayload.date_de_dobtention_du_permis = dateObtention.toISOString();
        }
        
        if (permisData.date_de_delivrance_du_permis) {
          const dateDelivrance = new Date(permisData.date_de_delivrance_du_permis);
          dossierPayload.date_de_delivrance_du_permis = dateDelivrance.toISOString();
        }
      }

      // Ajouter auto_ecole_id et formation_id seulement si nouveau permis
      if (isNouveauPermis) {
        if (!selectedAutoEcole || !formationData.formation_id) {
          setError('Auto-école et formation sont obligatoires pour un nouveau permis');
          setLoading(false);
          return;
        }
        dossierPayload.auto_ecole_id = selectedAutoEcole.id;
        dossierPayload.formation_id = formationData.formation_id;
        
        // Si la formation est de type C, ajouter les informations du permis B d'origine
        // Cette logique sera gérée dans le contexte
      }

      // Ajouter referenciel_id si fourni
      if (formationData.referenciel_id) {
        dossierPayload.referenciel_id = formationData.referenciel_id;
        
        if (!isNouveauPermis) {
          try {
            const autoEcolesResponse = await autoEcoleService.getAutoEcoles(1, 1000, {});
            const allAutoEcoles = autoEcolesResponse.data || [];
            
            const cnepcAutoEcole = allAutoEcoles.find((ae: AutoEcole) => 
              ae.nom_auto_ecole && ae.nom_auto_ecole.trim().toUpperCase() === 'CNEPC'
            );
            
            if (cnepcAutoEcole) {
              const cnepcFormations = await autoEcoleService.getFormationsByAutoEcole(cnepcAutoEcole.id);
              
              const matchingFormation = cnepcFormations.find((formation: any) => {
                const formationTypePermisId = formation.type_permis_id || formation.type_permis?.id;
                return formationTypePermisId === formationData.referenciel_id;
              });
              
              if (matchingFormation) {
                dossierPayload.auto_ecole_id = cnepcAutoEcole.id;
                dossierPayload.formation_id = matchingFormation.id;
              }
            }
          } catch (err: any) {
            console.error('Erreur lors de la recherche de l\'auto-école CNEPC:', err);
          }
        }
      }
      
      const response = await autoEcoleService.createDossier(dossierPayload);

      setSuccess(response.message || 'Dossier créé avec succès !');
      
      setTimeout(() => {
        resetForm();
        navigate('/gestion-dossier');
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        let errorDetails = '';
        Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
          const messageList = Array.isArray(messages) ? messages : [messages];
          errorDetails += `\n• ${field}: ${messageList.join(', ')}`;
        });
        setError(`Erreur de validation: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de la création du dossier');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Finalisation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vérifiez les informations et finalisez la création du dossier
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FinalisationStep
          formationData={formationData}
          referentiels={referentiels}
          loadingReferentiels={loadingReferentiels}
          loading={loading}
          onFormationDataChange={setFormationData}
          onSubmit={handleSubmit}
          onBack={onBack}
          error={error}
        />
      </Box>
    </Box>
  );
};

export default FinalisationPage;

