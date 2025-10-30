import { BaseService } from '../../../shared/services/BaseService';
import { API_ENDPOINTS } from '../../../shared/constants/api';
import axiosClient from '../../../shared/environment/envdev';
import { ReceptionActionResponse, ReceptionDossier, EpreuvesResultat } from '../types';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';

class ReceptionService extends BaseService {
  // Maps pour stocker les candidats et formations (même méthode que DemandesInscriptionTable)
  private candidatsMap: Map<string, any> = new Map();
  private formationsMap: Map<string, any> = new Map();
  private autoEcolesMap: Map<string, any> = new Map();

  async listIncoming(): Promise<ReceptionDossier[]> {
    try {
      console.log('📋 Chargement des dossiers de réception...');
      
      // Charger d'abord les candidats, formations et auto-écoles
      await this.chargerCandidatsEtFormations();
      
      // Récupérer les programmes de sessions (dossiers envoyés)
      const res = await axiosClient.get('/programme-sessions');
      const items = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      
      console.log('📦 Programmes de sessions reçus:', items.length);
      
      // Mapper vers ReceptionDossier en utilisant les maps, avec fallback async pour la formation
      const mapped: ReceptionDossier[] = await Promise.all(items.map(async (ps: any, index: number) => {
        const dossier = ps?.dossier || {};
        const candidatId = dossier?.candidat_id;
        const formationId = dossier?.formation_id;
        const autoEcoleId = dossier?.auto_ecole_id;
        
        console.log(`\n🔄 Mapping dossier ${index + 1}:`);
        console.log('  • Candidat ID:', candidatId);
        console.log('  • Formation ID:', formationId);
        console.log('  • Auto-école ID:', autoEcoleId);
        
        // Récupérer les informations depuis les maps
        const candidat = this.candidatsMap.get(candidatId) || this.candidatsMap.get(`personne_${dossier?.candidat?.personne_id}`);
        let formation = this.formationsMap.get(formationId);
        const autoEcole = this.autoEcolesMap.get(autoEcoleId);
        
        console.log('  • Candidat trouvé dans map:', !!candidat);
        console.log('  • Formation trouvée dans map:', !!formation);
        console.log('  • Auto-école trouvée dans map:', !!autoEcole);
        
        const candidatPersonne = candidat?.personne || dossier?.candidat?.personne || {};
        // Fallback: si aucune formation trouvée dans les maps ni dans le payload, tenter un fetch direct
        if (!formation && !dossier?.formation && formationId) {
          try {
            const fetched = await autoEcoleService.getFormationById(formationId);
            formation = fetched;
          } catch (err) {
            console.warn('⚠️ Impossible de récupérer la formation via fallback:', formationId, err);
          }
        }
        const formationDetails = formation || dossier?.formation || {};
        const autoEcoleDetails = autoEcole || dossier?.auto_ecole || {};
        
        const result = {
          id: ps.id || dossier.id,
          reference: dossier.id || ps.dossier_id || ps.reference || '',
          candidatNom: candidatPersonne.nom || '',
          candidatPrenom: candidatPersonne.prenom || '',
          autoEcoleNom: autoEcoleDetails.nom_auto_ecole || autoEcoleDetails.nom || '',
          dateEnvoi: ps?.created_at || new Date().toISOString(),
          statut: 'envoye',
          dateExamen: ps?.date_examen || '',
          details: {
            ...ps,
            candidat_complet: candidat,
            formation_complete: formationDetails,
            auto_ecole_complete: autoEcoleDetails
          },
        } as ReceptionDossier;

        // Fusionner les épreuves locales persistées (pour persistance après reload)
        try {
          const localEpreuves = this.getEpreuvesLocal(result.id);
          if (localEpreuves) {
            (result as any).epreuves = localEpreuves;
          }
        } catch {}
        
        console.log('  • Résultat candidat:', `${result.candidatNom} ${result.candidatPrenom}`);
        console.log('  • Résultat auto-école:', result.autoEcoleNom);
        console.log('  • Résultat formation:', formationDetails?.type_permis?.libelle || 'N/A');
        
        return result;
      }));
      
      console.log('✅ Dossiers mappés avec succès:', mapped.length);
      
      // Afficher les détails des dossiers mappés
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 DOSSIERS DE RÉCEPTION MAPPÉS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      mapped.forEach((dossier, index) => {
        console.log(`\n📦 Dossier ${index + 1}:`);
        console.log('  • ID:', dossier.id);
        console.log('  • Référence:', dossier.reference);
        console.log('  • Candidat:', `${dossier.candidatNom} ${dossier.candidatPrenom}`);
        console.log('  • Auto-école:', dossier.autoEcoleNom);
        console.log('  • Date envoi:', dossier.dateEnvoi);
        console.log('  • Date examen:', dossier.dateExamen || 'N/A');
        console.log('  • Statut:', dossier.statut);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
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
        
        console.log('📚 Formations brutes reçues:', formations.length);
        console.log('📚 Première formation:', formations[0]);
        
        for (const formation of formations) {
          try {
            const formationDetails = await autoEcoleService.getFormationById(formation.id);
            formationsMapTemp.set(formation.id, formationDetails);
            console.log(`✅ Formation ${formation.id} chargée:`, formationDetails?.type_permis?.libelle || 'N/A');
          } catch (error) {
            console.warn(`⚠️ Impossible de récupérer les détails de la formation ${formation.id}:`, error);
            formationsMapTemp.set(formation.id, formation);
          }
        }
        
        this.formationsMap = formationsMapTemp;
        console.log('✅ Formations chargées:', formationsMapTemp.size);
        console.log('📚 IDs formations:', Array.from(formationsMapTemp.keys()));
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


