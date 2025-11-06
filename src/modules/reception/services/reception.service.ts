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
      console.log('📋 Chargement des dossiers de réception via /programme-sessions...');
      
      // Récupérer l'ID de l'auto-école pour filtrer si nécessaire (optionnel pour les admins CNEPC)
      const autoEcoleId = getAutoEcoleId();
      
      console.log('🏫 Auto-école ID:', autoEcoleId || 'Aucun (affichage de tous les programme-sessions)');
      
      // Faire un GET sur /programme-sessions pour récupérer tous les programme_sessions avec leurs dossiers
      console.log('🔍 Récupération des programme-sessions...');
      const response = await axiosClient.get('/programme-sessions');
      
      console.log('📦 Programme-sessions récupérés (raw):', response.data);
      console.log('📦 Type de la réponse:', typeof response.data);
      console.log('📦 Est un tableau?:', Array.isArray(response.data));
      console.log('📦 Clés de response.data:', response.data ? Object.keys(response.data) : 'null');
      
      // La réponse peut être soit un tableau, soit un objet avec une propriété data ou programme_sessions
      // Structure attendue: { success: true, programme_session: {...} } ou [{ programme_session: {...} }]
      let programmeSessions: any[] = [];
      if (Array.isArray(response.data)) {
        programmeSessions = response.data;
        console.log('✅ Réponse est un tableau direct');
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        programmeSessions = response.data.data;
        console.log('✅ Réponse dans response.data.data');
      } else if (response.data?.programme_sessions && Array.isArray(response.data.programme_sessions)) {
        programmeSessions = response.data.programme_sessions;
        console.log('✅ Réponse dans response.data.programme_sessions');
      } else if (response.data?.programme_session) {
        // Si c'est un seul programme_session, le mettre dans un tableau
        programmeSessions = [response.data];
        console.log('✅ Réponse est un seul programme_session dans response.data');
      } else if (response.data?.success && response.data?.data) {
        programmeSessions = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        console.log('✅ Réponse dans response.data.success.data');
      } else {
        console.warn('⚠️ Structure de réponse non reconnue, tentative d\'extraction...');
        // Dernière tentative : chercher programme_session dans la structure
        if (response.data && typeof response.data === 'object') {
          const keys = Object.keys(response.data);
          console.log('📋 Clés disponibles:', keys);
          // Essayer de trouver un tableau quelque part
          for (const key of keys) {
            if (Array.isArray((response.data as any)[key])) {
              programmeSessions = (response.data as any)[key];
              console.log(`✅ Trouvé un tableau dans response.data.${key}`);
              break;
            }
          }
        }
      }
      
      console.log(`📊 ${programmeSessions.length} programme-session(s) récupéré(s)`);
      if (programmeSessions.length > 0) {
        console.log('📋 Premier programme-session:', programmeSessions[0]);
      }
      
      if (programmeSessions.length === 0) {
        console.log('⚠️ Aucun programme-session trouvé');
        return [];
      }
      
      // Filtrer par auto-école seulement si un autoEcoleId est disponible
      // Sinon, afficher tous les programme-sessions (cas d'un admin CNEPC)
      const programmeSessionsFiltres = autoEcoleId 
        ? programmeSessions.filter((ps: any) => {
            const dossier = ps.dossier || ps.programme_session?.dossier;
            return dossier && dossier.auto_ecole_id === autoEcoleId;
          })
        : programmeSessions; // Afficher tous les programme-sessions si pas d'auto-école
      
      console.log(`📋 ${programmeSessionsFiltres.length} programme-session(s) ${autoEcoleId ? `pour l'auto-école ${autoEcoleId}` : '(tous)'}`);
      
      // Charger d'abord les candidats, formations et auto-écoles pour le mapping (optionnel, car les données sont déjà dans le dossier)
      await this.chargerCandidatsEtFormations();
      
      // Mapper les programme-sessions vers ReceptionDossier
      // Récupérer le dossier complet pour chaque programme-session car programme_session.dossier ne contient que les IDs
      const mapped: (ReceptionDossier | null)[] = await Promise.all(programmeSessionsFiltres.map(async (ps: any, index: number) => {
        // Extraire le programme_session et le dossier
        const programmeSession = ps.programme_session || ps;
        const dossierMinimal = programmeSession.dossier || ps.dossier;
        
        if (!dossierMinimal || !dossierMinimal.id) {
          console.warn(`⚠️ Programme-session ${programmeSession.id} n'a pas de dossier associé`);
          return null;
        }
        
        console.log(`\n🔄 Mapping programme-session ${index + 1}:`);
        console.log('  • Programme-session ID:', programmeSession.id);
        console.log('  • Dossier ID:', dossierMinimal.id);
        console.log('  • Date examen:', programmeSession.date_examen);
        
        // Récupérer le dossier complet avec toutes les relations (candidat, formation, auto_ecole)
        let dossierComplet: any = null;
        try {
          console.log(`  📋 Récupération du dossier complet ${dossierMinimal.id}...`);
          dossierComplet = await autoEcoleService.getDossierById(dossierMinimal.id);
          console.log(`  ✅ Dossier complet récupéré`);
        } catch (error) {
          console.error(`  ❌ Erreur lors de la récupération du dossier complet:`, error);
          // Utiliser le dossier minimal en fallback
          dossierComplet = dossierMinimal;
        }
        
        const dossier = dossierComplet || dossierMinimal;
        const candidat = dossier.candidat;
        let formation = dossier.formation;
        const autoEcole = dossier.auto_ecole;
        
        console.log('  • Candidat ID:', candidat?.id || dossierMinimal.candidat_id);
        console.log('  • Formation ID:', formation?.id || dossierMinimal.formation_id);
        console.log('  • Auto-école ID:', dossier.auto_ecole_id || dossierMinimal.auto_ecole_id);
        console.log('  • Formation complète (raw):', formation);
        console.log('  • Montant dans formation:', {
          montant: formation?.montant,
          montant_formate: formation?.montant_formate,
          prix: formation?.prix
        });
        
        // Enrichir les données de formation si nécessaire (charger type_permis si seulement l'ID est présent)
        if (formation && !formation.type_permis && formation.type_permis_id) {
          try {
            console.log(`  📋 Enrichissement du type de permis pour la formation ${formation.id}...`);
            const typePermisResponse = await axiosClient.get(`/referentiels/${formation.type_permis_id}`);
            if (typePermisResponse.data.success && typePermisResponse.data.data) {
              formation.type_permis = typePermisResponse.data.data;
              console.log(`  ✅ Type de permis récupéré:`, formation.type_permis?.libelle || formation.type_permis?.nom);
            }
          } catch (error) {
            console.warn(`  ⚠️ Impossible de charger le type de permis pour la formation ${formation.id}:`, error);
          }
        }
        
        // Enrichir la session si nécessaire
        if (formation && !formation.session && formation.session_id) {
          try {
            console.log(`  📋 Enrichissement de la session pour la formation ${formation.id}...`);
            const sessionResponse = await axiosClient.get(`/referentiels/${formation.session_id}`);
            if (sessionResponse.data.success && sessionResponse.data.data) {
              formation.session = sessionResponse.data.data;
              console.log(`  ✅ Session récupérée:`, formation.session?.libelle || formation.session?.nom);
            }
          } catch (error) {
            console.warn(`  ⚠️ Impossible de charger la session pour la formation ${formation.id}:`, error);
          }
        }
        
        // Récupérer les informations depuis les maps si le dossier complet n'a pas les relations
        const candidatFromMap = candidat ? null : (this.candidatsMap.get(dossierMinimal.candidat_id) || this.candidatsMap.get(`personne_${candidat?.personne_id}`));
        const formationFromMap = formation ? null : this.formationsMap.get(dossierMinimal.formation_id);
        const autoEcoleFromMap = autoEcole ? null : this.autoEcolesMap.get(dossier.auto_ecole_id || dossierMinimal.auto_ecole_id);
        
        // Si la formation du map a le type_permis, l'utiliser
        if (formationFromMap && formationFromMap.type_permis && !formation?.type_permis) {
          formation = { ...formation, type_permis: formationFromMap.type_permis };
        }
        
        // Si la formation du map a le montant mais pas la formation du dossier, utiliser le montant du map
        if (formationFromMap) {
          // Fusionner les propriétés de montant du map si elles manquent dans la formation du dossier
          if (!formation?.montant && formationFromMap.montant) {
            formation = { ...formation, montant: formationFromMap.montant };
          }
          if (!formation?.montant_formate && formationFromMap.montant_formate) {
            formation = { ...formation, montant_formate: formationFromMap.montant_formate };
          }
          if (!formation?.prix && formationFromMap.prix) {
            formation = { ...formation, prix: formationFromMap.prix };
          }
          
          console.log('  • Montant depuis map:', {
            mapMontant: formationFromMap.montant,
            mapMontantFormate: formationFromMap.montant_formate,
            mapPrix: formationFromMap.prix,
            formationMontant: formation?.montant,
            formationMontantFormate: formation?.montant_formate,
            formationPrix: formation?.prix
          });
        }
        
        // Utiliser les données du dossier complet en priorité, avec fallback sur les maps
        const candidatFinal = candidat || candidatFromMap;
        const formationFinal = formation || formationFromMap;
        const autoEcoleFinal = autoEcole || autoEcoleFromMap || {};
        
        const candidatPersonne = candidatFinal?.personne || candidat?.personne || {};
        
        const result: ReceptionDossier = {
          id: dossier.id,
          reference: dossier.id,
          candidatNom: candidatPersonne.nom || '',
          candidatPrenom: candidatPersonne.prenom || '',
          autoEcoleNom: autoEcoleFinal.nom_auto_ecole || autoEcoleFinal.nom || '',
          dateEnvoi: programmeSession.created_at || dossier.updated_at || dossier.created_at || new Date().toISOString(),
          statut: 'valide',
          dateExamen: programmeSession.date_examen || '',
          details: {
            dossier: dossierComplet || dossier,
            candidat_complet: candidatFinal,
            formation_complete: formationFinal,
            auto_ecole_complete: autoEcoleFinal,
            programme_session: programmeSession
          },
        };
        
        // Récupérer les épreuves depuis les données du dossier si disponibles
        if (dossier.epreuves) {
          (result as any).epreuves = dossier.epreuves;
        }
        
        console.log('  • Résultat candidat:', `${result.candidatNom} ${result.candidatPrenom}`);
        console.log('  • Résultat auto-école:', result.autoEcoleNom);
        console.log('  • Résultat formation:', formationFinal?.type_permis?.libelle || formationFinal?.nom || 'N/A');
        console.log('  • Type permis présent:', formationFinal?.type_permis ? 'Oui' : 'Non');
        console.log('  • Montant formation:', formationFinal?.montant_formate || formationFinal?.montant || formationFinal?.prix || 'Non disponible');
        console.log('  • Date examen:', result.dateExamen);
        
        return result;
      }));
      
      // Filtrer les nulls
      const mappedFiltered = mapped.filter((d: ReceptionDossier | null) => d !== null) as ReceptionDossier[];
      
      console.log('✅ Dossiers mappés avec succès:', mappedFiltered.length);
      
      // Afficher les détails des dossiers mappés
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 DOSSIERS DE RÉCEPTION MAPPÉS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      mappedFiltered.forEach((dossier, index) => {
        console.log(`\n📦 Dossier ${index + 1}:`);
        console.log('  • ID:', dossier.id);
        console.log('  • Référence:', dossier.reference);
        console.log('  • Candidat:', `${dossier.candidatNom} ${dossier.candidatPrenom}`);
        console.log('  • Auto-école:', dossier.autoEcoleNom);
        console.log('  • Date envoi:', dossier.dateEnvoi);
        console.log('  • Date examen:', dossier.dateExamen || 'N/A');
        console.log('  • Statut:', dossier.statut);
        console.log('  • Formation complète:', dossier.details?.formation_complete ? 'Oui' : 'Non');
        console.log('  • Candidat complet:', dossier.details?.candidat_complet ? 'Oui' : 'Non');
        console.log('  • Montant formation:', dossier.details?.formation_complete?.montant_formate || dossier.details?.formation_complete?.montant || dossier.details?.formation_complete?.prix || 'Non disponible');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return mappedFiltered;
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

  // Enregistre les résultats des épreuves pour un dossier via l'API
  async saveEpreuves(dossierProgrammeId: string, results: EpreuvesResultat): Promise<{ success: boolean }> {
    try {
      // Enregistrer via l'API
      await axiosClient.post(`/programme-sessions/${dossierProgrammeId}/epreuves`, results);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement des épreuves:', error);
      throw error;
    }
  }
}

export const receptionService = new ReceptionService();


