import { DemandeInscription } from '../types/inscription';
import axiosClient from '../../../shared/environment/envdev';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';
import { getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';

// Interface pour un élève validé
export interface EleveValide {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate?: string;
  lieuNaissance?: string;
  nationality: string;
  nationaliteEtrangere?: string;
  status: 'validated';
  documentsCount: number;
  validatedAt: string;
  demandeId: string; // Référence vers la demande d'origine
  originalDocuments: any[]; // Documents de la demande d'origine
  autoEcole: {
    id: string;
    name: string;
  };
}

// Service de validation des demandes
export class ValidationService {

  // Envoyer un dossier au CNEPC (programmation de session)
  static async envoyerAuCNEPC(payload: { dossier_id: string; date_examen: string }): Promise<any> {
    try {
      // Utiliser le client principal (proxy / baseURL configuré)
      const { default: axiosClient } = await import('../../../shared/environment/envdev');
      const response = await axiosClient.post('/programme-sessions', payload);
      const data = response.data;

      // Les données sont maintenant stockées directement dans la base de données
      // Plus besoin de localStorage

      return data;
    } catch (error: any) {
      console.error('Erreur envoi CNEPC:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de l\'envoi au CNEPC');
    }
  }

  // Valider une demande via l'API en mettant à jour le statut du dossier
  static async validerDemande(demande: DemandeInscription): Promise<EleveValide> {
    try {
      // Appeler l'API pour mettre à jour le statut du dossier vers "valide"
      const response = await axiosClient.put(`/dossiers/${demande.id}`, {
        statut: 'valide'
      });

      if (response.data.success && response.data.data) {
        const dossier = response.data.data;
        
        // Mapper le dossier mis à jour vers EleveValide
        const candidat = dossier.candidat;
        const personne = candidat?.personne || {};
        
    const nouvelEleve: EleveValide = {
          id: `eleve-${dossier.id}`,
          firstName: personne.prenom || demande.eleve.firstName,
          lastName: personne.nom || demande.eleve.lastName,
          email: personne.email || demande.eleve.email,
          phone: personne.contact || demande.eleve.phone,
          address: personne.adresse || demande.eleve.address,
          birthDate: candidat?.date_naissance || demande.eleve.birthDate,
          lieuNaissance: candidat?.lieu_naissance || demande.eleve.lieuNaissance,
          nationality: candidat?.nationalite || demande.eleve.nationality,
      nationaliteEtrangere: demande.eleve.nationaliteEtrangere,
      status: 'validated',
          documentsCount: dossier.documents?.length || demande.documents?.length || 0,
      validatedAt: new Date().toISOString(),
          demandeId: dossier.id,
          originalDocuments: dossier.documents || demande.documents || [],
          autoEcole: dossier.auto_ecole ? {
            id: dossier.auto_ecole.id,
            name: dossier.auto_ecole.nom_auto_ecole || demande.autoEcole.name
          } : demande.autoEcole
        };

        console.log('✅ Demande validée via API et transférée vers les élèves validés:', nouvelEleve);
        return nouvelEleve;
      }

      throw new Error('Erreur lors de la validation de la demande');
    } catch (error: any) {
      console.error('❌ Erreur lors de la validation de la demande:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de la validation de la demande');
    }
  }

  // Récupérer tous les élèves validés (dossiers avec statut "valide" depuis l'API)
  // Utilise la même méthode que DemandesInscriptionTable.tsx
  static async getElevesValides(): Promise<EleveValide[]> {
    try {
      console.log('🔄 Chargement des élèves validés via autoEcoleService...');
      
      // Récupérer l'ID de l'auto-école (même méthode que DemandesInscriptionTable.tsx)
      const autoEcoleId = getAutoEcoleId();
      
      if (!autoEcoleId) {
        console.warn('⚠️ Aucun ID d\'auto-école trouvé');
        return [];
      }
      
      console.log('🏫 Auto-école ID:', autoEcoleId);
      
      // Utiliser la même méthode que DemandesInscriptionTable.tsx : getDossiersByAutoEcoleId
      // avec filtre statut: 'valide'
      const filters = {
        statut: 'valide' as any
      };
      
      console.log('🔍 Filtres envoyés à l\'API:', filters);
      
      const response = await autoEcoleService.getDossiersByAutoEcoleId(autoEcoleId, filters);
      
      console.log('📦 Dossiers récupérés depuis l\'API:', response.dossiers?.length || 0);
      console.log('📋 Structure de la réponse:', response);
      
      if (!response.dossiers || response.dossiers.length === 0) {
        console.log('⚠️ Aucun dossier validé trouvé pour cette auto-école');
        return [];
      }
      
      // Récupérer les vraies données complètes de chaque dossier (comme dans DemandesInscriptionTable.tsx)
      console.log('🔄 Récupération des vraies données depuis l\'API pour chaque dossier...');
      
      const dossiersComplets = await Promise.all(
        response.dossiers.map(async (dossier: any) => {
          try {
            console.log(`📋 Récupération des vraies données du dossier ${dossier.id}...`);
            const dossierComplet = await autoEcoleService.getDossierById(dossier.id);
            console.log(`✅ Dossier ${dossier.id} avec vraies données récupéré`);
            return dossierComplet;
          } catch (error) {
            console.error(`❌ Erreur lors de la récupération du dossier ${dossier.id}:`, error);
            // Retourner le dossier original en cas d'erreur
            return dossier;
          }
        })
      );
      
      console.log(`📊 ${dossiersComplets.length} dossier(s) complet(s) récupéré(s) avec statut "valide"`);
      
      // Mapper les dossiers vers EleveValide (même structure que DemandesInscriptionTable.tsx)
      const elevesValides = dossiersComplets.map((dossier: any, index: number) => {
        const candidat = dossier.candidat;
        const personne = candidat?.personne || {};
        
        const eleveValide = {
          id: `eleve-${dossier.id}`,
          firstName: personne.prenom || '',
          lastName: personne.nom || '',
          email: personne.email || '',
          phone: personne.contact || '',
          address: personne.adresse || '',
          birthDate: candidat?.date_naissance || null,
          lieuNaissance: candidat?.lieu_naissance || null,
          nationality: candidat?.nationalite || '',
          nationaliteEtrangere: candidat?.nationalite_etrangere || undefined,
          status: 'validated' as const,
          documentsCount: dossier.documents?.length || 0,
          validatedAt: dossier.updated_at || dossier.created_at || new Date().toISOString(),
          demandeId: dossier.id,
          originalDocuments: dossier.documents || [],
          autoEcole: dossier.auto_ecole ? {
            id: dossier.auto_ecole.id || dossier.auto_ecole_id || '',
            name: dossier.auto_ecole.nom_auto_ecole || ''
          } : { id: dossier.auto_ecole_id || '', name: '' }
        };
        
        console.log(`✅ Élève ${index + 1} mappé:`, eleveValide);
        
        return eleveValide;
      });

      console.log(`✅ ${elevesValides.length} élève(s) validé(s) retourné(s)`);
      return elevesValides;
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des élèves validés:', error);
      console.error('📋 Détails de l\'erreur:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de la récupération des élèves validés');
    }
  }

  // Récupérer un élève validé par ID (via l'API)
  static async getEleveValideById(id: string): Promise<EleveValide | null> {
    try {
      // Extraire l'ID du dossier depuis l'ID de l'élève (format: eleve-{dossierId})
      const dossierId = id.replace('eleve-', '');
      const response = await axiosClient.get(`/dossiers/${dossierId}`);
      
      if (response.data.success && response.data.data) {
        const dossier = response.data.data;
        const candidat = dossier.candidat;
        const personne = candidat?.personne || {};
        
        return {
          id: `eleve-${dossier.id}`,
          firstName: personne.prenom || '',
          lastName: personne.nom || '',
          email: personne.email || '',
          phone: personne.contact || '',
          address: personne.adresse || '',
          birthDate: candidat?.date_naissance,
          lieuNaissance: candidat?.lieu_naissance,
          nationality: candidat?.nationalite || '',
          nationaliteEtrangere: undefined,
          status: 'validated',
          documentsCount: dossier.documents?.length || 0,
          validatedAt: dossier.updated_at || dossier.created_at || new Date().toISOString(),
          demandeId: dossier.id,
          originalDocuments: dossier.documents || [],
          autoEcole: dossier.auto_ecole ? {
            id: dossier.auto_ecole.id,
            name: dossier.auto_ecole.nom_auto_ecole || ''
          } : { id: '', name: '' }
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'élève:', error);
      if (error?.response?.status === 404) {
        return null;
      }
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de la récupération de l\'élève');
    }
  }

  // Supprimer un élève validé (en changeant le statut du dossier)
  static async supprimerEleveValide(id: string): Promise<boolean> {
    try {
      // Extraire l'ID du dossier depuis l'ID de l'élève
      const dossierId = id.replace('eleve-', '');
      // Remettre le statut à "en_attente" ou supprimer le dossier
      await axiosClient.put(`/dossiers/${dossierId}`, {
        statut: 'en_attente'
      });
      console.log('✅ Élève supprimé (statut remis à en_attente):', id);
      return true;
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'élève:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de la suppression de l\'élève');
    }
  }

  // Mettre à jour un élève validé (via l'API)
  static async mettreAJourEleveValide(id: string, updates: Partial<EleveValide>): Promise<EleveValide | null> {
    try {
      // Extraire l'ID du dossier depuis l'ID de l'élève
      const dossierId = id.replace('eleve-', '');
      // Mettre à jour le dossier
      const response = await axiosClient.put(`/dossiers/${dossierId}`, updates);
      
      if (response.data.success && response.data.data) {
        const dossier = response.data.data;
        const candidat = dossier.candidat;
        const personne = candidat?.personne || {};
        
        return {
          id: `eleve-${dossier.id}`,
          firstName: personne.prenom || '',
          lastName: personne.nom || '',
          email: personne.email || '',
          phone: personne.contact || '',
          address: personne.adresse || '',
          birthDate: candidat?.date_naissance,
          lieuNaissance: candidat?.lieu_naissance,
          nationality: candidat?.nationalite || '',
          nationaliteEtrangere: undefined,
          status: 'validated',
          documentsCount: dossier.documents?.length || 0,
          validatedAt: dossier.updated_at || dossier.created_at || new Date().toISOString(),
          demandeId: dossier.id,
          originalDocuments: dossier.documents || [],
          autoEcole: dossier.auto_ecole ? {
            id: dossier.auto_ecole.id,
            name: dossier.auto_ecole.nom_auto_ecole || ''
          } : { id: '', name: '' }
        };
      }
      
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'élève:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de la mise à jour de l\'élève');
    }
  }

  // Récupérer les IDs des demandes validées (depuis l'API)
  static async getDemandesValidees(): Promise<string[]> {
    try {
      const response = await axiosClient.get('/dossiers', {
        params: {
          statut: 'valide'
        }
      });
      
      if (response.data.success && response.data.dossiers) {
        const dossiers = Array.isArray(response.data.dossiers) 
          ? response.data.dossiers 
          : [response.data.dossiers];
        return dossiers.map((d: any) => d.id);
      }
      
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des demandes validées:', error);
      return [];
    }
  }

  // Vérifier si une demande a été validée (via l'API)
  static isDemandeValideeLocal(demandeId: string): boolean {
    // Cette méthode est toujours utilisée localement pour éviter les appels API répétés
    // On peut la garder mais elle ne sera pas exacte à 100%
    // Pour une vérification exacte, il faudrait appeler l'API
    return false; // Retourner false par défaut, le filtrage se fera via l'API
  }

  // Obtenir les statistiques des élèves validés (depuis l'API)
  static async getStatistiquesElevesValides(): Promise<{
    total: number;
    valides: number;
    documentsComplets: number;
    documentsIncomplets: number;
  }> {
    try {
      // Calculer depuis la liste des élèves validés
      const eleves = await this.getElevesValides();
      const total = eleves.length;
      const valides = eleves.filter(eleve => eleve.status === 'validated').length;
      const documentsComplets = eleves.filter(eleve => eleve.documentsCount >= 4).length;
    const documentsIncomplets = total - documentsComplets;

    return {
      total,
      valides,
      documentsComplets,
      documentsIncomplets
    };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        total: 0,
        valides: 0,
        documentsComplets: 0,
        documentsIncomplets: 0
      };
    }
  }
}

export default ValidationService;
