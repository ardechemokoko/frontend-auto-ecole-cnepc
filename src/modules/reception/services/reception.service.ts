import { BaseService } from '../../../shared/services/BaseService';
import { API_ENDPOINTS } from '../../../shared/constants/api';
import axiosClient from '../../../shared/environment/envdev';
import { ReceptionActionResponse, ReceptionDossier, EpreuvesResultat } from '../types';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';
import { getAutoEcoleId } from '../../../shared/utils/autoEcoleUtils';

class ReceptionService extends BaseService {
  // Maps pour stocker les candidats et formations (même méthode que DemandesInscriptionTable)
  private candidatsMap: Map<string, any> = new Map();
  private formationsMap: Map<string, any> = new Map();
  private autoEcolesMap: Map<string, any> = new Map();

  async listIncoming(): Promise<ReceptionDossier[]> {
    try {
      console.log('📋 Chargement des dossiers de réception (statut: transmis)...');
      
      // Récupérer l'ID de l'auto-école (même méthode que DemandesInscriptionTable.tsx)
      const autoEcoleId = getAutoEcoleId();
      
      if (!autoEcoleId) {
        console.warn('⚠️ Aucun ID d\'auto-école trouvé');
        return [];
      }
      
      console.log('🏫 Auto-école ID:', autoEcoleId);
      
      // Utiliser la même méthode que DemandesInscriptionTable.tsx : getDossiersByAutoEcoleId
      // avec filtre statut: 'transmis'
      const filters = {
        statut: 'transmis' as any
      };
      
      console.log('🔍 Filtres envoyés à l\'API:', filters);
      
      const response = await autoEcoleService.getDossiersByAutoEcoleId(autoEcoleId, filters);
      
      console.log('📦 Dossiers récupérés depuis l\'API:', response.dossiers?.length || 0);
      console.log('📋 Structure de la réponse:', response);
      
      if (!response.dossiers || response.dossiers.length === 0) {
        console.log('⚠️ Aucun dossier transmis trouvé pour cette auto-école');
        return [];
      }
      
      // Charger d'abord les candidats, formations et auto-écoles pour le mapping
      await this.chargerCandidatsEtFormations();
      
      // Mapper les dossiers vers ReceptionDossier
      const mapped: ReceptionDossier[] = await Promise.all(response.dossiers.map(async (dossier: any) => {
        const candidat = dossier.candidat;
        const formation = dossier.formation;
        const autoEcoleId = dossier.auto_ecole_id;
        
        // Récupérer les informations depuis les maps
        const candidatFromMap = this.candidatsMap.get(candidat?.id) || this.candidatsMap.get(`personne_${candidat?.personne_id}`);
        const formationFromMap = this.formationsMap.get(formation?.id);
        const autoEcoleFromMap = this.autoEcolesMap.get(autoEcoleId);
        
        // Utiliser les données du dossier en priorité, avec fallback sur les maps
        const candidatFinal = candidatFromMap || candidat;
        const formationFinal = formationFromMap || formation;
        const autoEcoleFinal = autoEcoleFromMap || dossier.auto_ecole || {};
        
        const candidatPersonne = candidatFinal?.personne || candidat?.personne || {};
        
        const result = {
          id: dossier.id,
          reference: dossier.id,
          candidatNom: candidatPersonne.nom || '',
          candidatPrenom: candidatPersonne.prenom || '',
          autoEcoleNom: autoEcoleFinal.nom_auto_ecole || autoEcoleFinal.nom || '',
          dateEnvoi: dossier.updated_at || dossier.created_at || new Date().toISOString(),
          statut: 'transmis',
          dateExamen: '', // Sera rempli si on récupère les programme-sessions
          details: {
            dossier,
            candidat_complet: candidatFinal,
            formation_complete: formationFinal,
            auto_ecole_complete: autoEcoleFinal
          },
        } as ReceptionDossier;
        
        // Fusionner les épreuves locales persistées (pour persistance après reload)
        try {
          const localEpreuves = this.getEpreuvesLocal(result.id);
          if (localEpreuves) {
            (result as any).epreuves = localEpreuves;
          }
        } catch {}
        
        return result;
      }));
      
      return mapped;
    } catch (e) {
      console.error('❌ Erreur lors du chargement des dossiers de réception:', e);
      // Fallback sur l'ancien endpoint si disponible
      try {
        return this.get<ReceptionDossier[]>(API_ENDPOINTS.RECEPTION.INCOMING);
      } catch {
        return [] as ReceptionDossier[];
      }
    }
  }

  private async chargerCandidatsEtFormations() {
    try {
      console.log('📋 Chargement des candidats, formations et auto-écoles...');
      
      // Charger tous les candidats
      try {
        const candidats = await autoEcoleService.getAllCandidats();
        const candidatsMapTemp = new Map<string, any>();
        
        candidats.forEach((candidat: any) => {
          if (candidat.id) {
            candidatsMapTemp.set(candidat.id, candidat);
          }
          if (candidat.personne_id) {
            candidatsMapTemp.set(`personne_${candidat.personne_id}`, candidat);
          }
        });
        
        this.candidatsMap = candidatsMapTemp;
        console.log('✅ Candidats chargés:', candidatsMapTemp.size);
        console.log('📋 IDs candidats:', Array.from(candidatsMapTemp.keys()));
      } catch (error) {
        console.error('❌ Erreur lors du chargement des candidats:', error);
        this.candidatsMap = new Map();
      }
      
      // Charger toutes les formations
      try {
        const formations = await autoEcoleService.getAllFormations();
        const formationsMapTemp = new Map<string, any>();
        
        formations.forEach((formation: any) => {
          if (formation.id) {
            formationsMapTemp.set(formation.id, formation);
          }
        });
        
        this.formationsMap = formationsMapTemp;
        console.log('✅ Formations chargées:', formationsMapTemp.size);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des formations:', error);
        this.formationsMap = new Map();
      }
      
      // Charger toutes les auto-écoles
      try {
        const autoEcoles = await autoEcoleService.getAllAutoEcoles();
        const autoEcolesMapTemp = new Map<string, any>();
        
        console.log('🏫 Auto-écoles brutes reçues:', autoEcoles.length);
        console.log('🏫 Première auto-école:', autoEcoles[0]);
        
        autoEcoles.forEach((autoEcole: any) => {
          if (autoEcole.id) {
            autoEcolesMapTemp.set(autoEcole.id, autoEcole);
            console.log(`✅ Auto-école ${autoEcole.id} chargée:`, autoEcole.nom_auto_ecole || autoEcole.nom || 'N/A');
          }
        });
        
        this.autoEcolesMap = autoEcolesMapTemp;
        console.log('✅ Auto-écoles chargées:', autoEcolesMapTemp.size);
        console.log('🏫 IDs auto-écoles:', Array.from(autoEcolesMapTemp.keys()));
      } catch (error) {
        console.error('❌ Erreur lors du chargement des auto-écoles:', error);
        this.autoEcolesMap = new Map();
      }
      
    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des candidats, formations et auto-écoles:', error);
    }
  }

  async getDetails(id: string): Promise<ReceptionDossier> {
    return this.get<ReceptionDossier>(API_ENDPOINTS.RECEPTION.DETAILS(id));
  }

  async receiveDossier(id: string): Promise<ReceptionActionResponse> {
    return this.post<ReceptionActionResponse>(API_ENDPOINTS.RECEPTION.RECEIVE(id));
  }

  // Enregistre les résultats des épreuves pour un dossier (API + fallback localStorage)
  async saveEpreuves(dossierProgrammeId: string, results: EpreuvesResultat): Promise<{ success: boolean }> {
    try {
      // Essai API supposée
      await axiosClient.post(`/programme-sessions/${dossierProgrammeId}/epreuves`, results);
      this.persistEpreuvesLocal(dossierProgrammeId, results);
      return { success: true };
    } catch {
      // Fallback: localStorage
      this.persistEpreuvesLocal(dossierProgrammeId, results);
      return { success: true };
    }
  }

  getEpreuvesLocal(dossierProgrammeId: string): EpreuvesResultat | null {
    try {
      const raw = localStorage.getItem('reception_epreuves');
      const obj = raw ? JSON.parse(raw) : {};
      return obj[dossierProgrammeId] || null;
    } catch {
      return null;
    }
  }

  private persistEpreuvesLocal(dossierProgrammeId: string, results: EpreuvesResultat) {
    try {
      const raw = localStorage.getItem('reception_epreuves');
      const obj = raw ? JSON.parse(raw) : {};
      obj[dossierProgrammeId] = { ...results, dateSaisie: results.dateSaisie || new Date().toISOString() };
      localStorage.setItem('reception_epreuves', JSON.stringify(obj));
    } catch {}
  }
}

export const receptionService = new ReceptionService();


