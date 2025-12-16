import { useState } from 'react';
import axiosClient from '../../../shared/environment/envdev';
import { CircuitSuivi } from '../services/circuit-suivi.service';

export const useCNEDDTTransfer = (
  dossierId?: string,
  circuit: CircuitSuivi | null,
  onSendToCNEDDT?: () => void
) => {
  const [sendingToCNEDDT, setSendingToCNEDDT] = useState(false);

  const handleSendToCNEDDT = async () => {
    if (!dossierId) {
      alert('ID du dossier manquant');
      return;
    }

    let typePermis: string | undefined = undefined;
    let typePermisId: string | undefined = undefined;

    try {
      setSendingToCNEDDT(true);
      console.log('🚚 Envoi du dossier à la CNEDDT:', dossierId);
      
      // Récupérer le dossier complet pour vérifier le type_permis
      try {
        const dossierResponse = await axiosClient.get(`/dossiers/${dossierId}`);
        const dossierData = dossierResponse.data?.data || dossierResponse.data;
        
        if (dossierData?.formation?.type_permis) {
          if (typeof dossierData.formation.type_permis === 'object') {
            typePermis = dossierData.formation.type_permis.code || 
                        dossierData.formation.type_permis.libelle || 
                        dossierData.formation.type_permis.id;
            typePermisId = dossierData.formation.type_permis.id;
          } else {
            typePermis = dossierData.formation.type_permis;
          }
        } else if (dossierData?.formation?.type_permis_id) {
          typePermisId = dossierData.formation.type_permis_id;
          try {
            const typePermisResponse = await axiosClient.get(`/referentiels/${dossierData.formation.type_permis_id}`);
            if (typePermisResponse.data?.data) {
              const typePermisData = typePermisResponse.data.data;
              typePermis = typePermisData.code || typePermisData.libelle || typePermisData.id;
            }
          } catch (err) {
            console.warn('⚠️ Impossible de charger le type de permis:', err);
          }
        }
      } catch (err) {
        console.warn('⚠️ Impossible de récupérer le dossier complet:', err);
      }
      
      // Si le type_permis n'est pas dans le dossier, utiliser celui du circuit
      if (!typePermis && circuit?.type_permis) {
        typePermis = circuit.type_permis;
        
        if (!typePermisId && typePermis) {
          try {
            const referentielsResponse = await axiosClient.get('/referentiels', {
              params: { 
                type_ref: 'type_permis',
                statut: 'true',
                per_page: 100
              }
            });
            
            let referentiels: any[] = [];
            if (Array.isArray(referentielsResponse.data)) {
              referentiels = referentielsResponse.data;
            } else if (referentielsResponse.data?.data && Array.isArray(referentielsResponse.data.data)) {
              referentiels = referentielsResponse.data.data;
            } else if (referentielsResponse.data?.data?.data && Array.isArray(referentielsResponse.data.data.data)) {
              referentiels = referentielsResponse.data.data.data;
            }
            
            const found = referentiels.find((r: any) => {
              if (!typePermis) return false;
              if (r.libelle && r.libelle.trim().toUpperCase() === typePermis.trim().toUpperCase()) {
                return true;
              }
              if (r.code && r.code.trim().toUpperCase() === typePermis.trim().toUpperCase()) {
                return true;
              }
              if (r.id && r.id.toString() === typePermis.trim()) {
                return true;
              }
              return false;
            });
            
            if (found) {
              typePermisId = found.id?.toString() || found.id;
              console.log('✅ ID du type de permis trouvé:', typePermisId);
            }
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer l\'ID du type de permis:', err);
          }
        }
      }
      
      const payload: any = {
        dossier_id: dossierId
      };
      
      if (!typePermisId) {
        const errorMsg = typePermis 
          ? `Impossible de trouver l'ID du type de permis "${typePermis}" dans les référentiels.`
          : 'Aucun type de permis trouvé dans le dossier ni dans le circuit.';
        
        console.error('❌', errorMsg);
        alert(`Erreur: ${errorMsg}`);
        setSendingToCNEDDT(false);
        return;
      }
      
      payload.type_permis_id = typePermisId;
      console.log('📤 Payload final:', payload);
      
      const response = await axiosClient.post('/dossiers/transfert', payload);
      console.log('✅ Réponse CNEDDT:', response.data);
      
      alert('Dossier envoyé à la CNEDDT avec succès');
      
      if (onSendToCNEDDT) {
        onSendToCNEDDT();
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi à la CNEDDT:', error);
      
      let errorMessage = 'Erreur lors de l\'envoi à la CNEDDT';
      
      if (error?.response?.status === 500) {
        errorMessage = 'Erreur serveur (500). Veuillez contacter l\'administrateur.';
        if (error?.response?.data?.message) {
          errorMessage = `Erreur serveur: ${error.response.data.message}`;
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        errorMessage += ` (${validationErrors})`;
      }
      
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setSendingToCNEDDT(false);
    }
  };

  return {
    sendingToCNEDDT,
    handleSendToCNEDDT
  };
};

