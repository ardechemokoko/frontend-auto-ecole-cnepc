import { DemandeInscription } from '../types/inscription';

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
  private static elevesValides: EleveValide[] = [];
  private static demandesValidees: string[] = []; // IDs des demandes validées
  private static readonly STORAGE_KEY = 'eleves_valides_storage';

  private static loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.elevesValides = parsed;
        }
      }
    } catch {}
  }

  // Envoyer un dossier au CNEPC (programmation de session)
  static async envoyerAuCNEPC(payload: { dossier_id: string; date_examen: string }): Promise<any> {
    try {
      // Utiliser le client principal (proxy / baseURL configuré)
      const { default: axiosClient } = await import('../../../shared/environment/envdev');
      const response = await axiosClient.post('/programme-sessions', payload);
      const data = response.data;

      // Persister pour le module Réception si success et objet disponible
      try {
        if (data?.success && data?.programme_session?.dossier) {
          const ps = data.programme_session;
          const dossier = ps.dossier;
          const personne = dossier?.candidat?.personne || {};
          const autoEcole = dossier?.auto_ecole || dossier?.formation?.auto_ecole;

          const incomingItem = {
            id: ps.id,
            reference: dossier.id,
            candidatNom: personne.nom || '',
            candidatPrenom: personne.prenom || '',
            autoEcoleNom: autoEcole?.nom_auto_ecole || autoEcole?.nom || '',
            dateEnvoi: new Date().toISOString(),
            statut: 'envoye'
          };

          const key = 'reception_incoming';
          const raw = localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          // éviter doublons par id
          const filtered = Array.isArray(arr) ? arr.filter((x: any) => x.id !== incomingItem.id) : [];
          filtered.unshift(incomingItem);
          localStorage.setItem(key, JSON.stringify(filtered));
          // garder la dernière réponse complète aussi
          localStorage.setItem('reception_last_response', JSON.stringify(data));
        }
      } catch {}

      return data;
    } catch (error: any) {
      console.error('Erreur envoi CNEPC:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Erreur lors de l\'envoi au CNEPC');
    }
  }

  private static saveToStorage() {
    try {
      // Sanitize non-serializable fields (e.g., File) before saving
      const serializable = this.elevesValides.map(e => ({
        ...e,
        originalDocuments: (e.originalDocuments || []).map((d: any) => {
          const { file, ...rest } = d || {};
          return rest; // drop File reference
        })
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch {}
  }

  private static getUploadedDocsForDemande(demandeId: string): any[] {
    try {
      const raw = localStorage.getItem(`candidat_docs_${demandeId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Valider une demande et la transférer vers les élèves validés
  static async validerDemande(demande: DemandeInscription): Promise<EleveValide> {
    // Charger état persistant
    this.loadFromStorage();

    // Récupérer les documents uploadés côté candidat (persistés)
    const uploadedDocs = this.getUploadedDocsForDemande(demande.id);
    const mergedDocuments = [...(demande.documents || []), ...uploadedDocs];
    // Créer un nouvel élève validé à partir de la demande
    const nouvelEleve: EleveValide = {
      id: `eleve-${Date.now()}`,
      firstName: demande.eleve.firstName,
      lastName: demande.eleve.lastName,
      email: demande.eleve.email,
      phone: demande.eleve.phone,
      address: demande.eleve.address,
      birthDate: demande.eleve.birthDate,
      lieuNaissance: demande.eleve.lieuNaissance,
      nationality: demande.eleve.nationality,
      nationaliteEtrangere: demande.eleve.nationaliteEtrangere,
      status: 'validated',
      documentsCount: mergedDocuments.length,
      validatedAt: new Date().toISOString(),
      demandeId: demande.id,
      originalDocuments: mergedDocuments, // Transmettre tous les documents (origine + uploadés)
      autoEcole: demande.autoEcole
    };

    // Ajouter à la liste des élèves validés
    this.elevesValides.push(nouvelEleve);
    this.saveToStorage();

    // Marquer la demande comme validée
    this.demandesValidees.push(demande.id);

    // Mettre à jour le dossier dans auto_ecole_info (localStorage) pour refléter l'envoi
    try {
      const autoRaw = localStorage.getItem('auto_ecole_info');
      if (autoRaw) {
        const autoData = JSON.parse(autoRaw);
        if (autoData && Array.isArray(autoData.dossiers)) {
          autoData.dossiers = autoData.dossiers.map((d: any) => {
            if (d.id === demande.id) {
              return {
                ...d,
                statut: 'eleve_inscrit',
                documents: mergedDocuments,
                date_modification: new Date().toISOString(),
              };
            }
            return d;
          });
          localStorage.setItem('auto_ecole_info', JSON.stringify(autoData));
        }
      }
    } catch {}

    // Simuler une mise à jour de la demande (marquer comme validée)
    console.log('Demande validée et transférée:', nouvelEleve);

    return nouvelEleve;
  }

  // Récupérer tous les élèves validés
  static async getElevesValides(): Promise<EleveValide[]> {
    this.loadFromStorage();
    return [...this.elevesValides];
  }

  // Récupérer un élève validé par ID
  static async getEleveValideById(id: string): Promise<EleveValide | null> {
    return this.elevesValides.find(eleve => eleve.id === id) || null;
  }

  // Supprimer un élève validé
  static async supprimerEleveValide(id: string): Promise<boolean> {
    const index = this.elevesValides.findIndex(eleve => eleve.id === id);
    if (index !== -1) {
      this.elevesValides.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Mettre à jour un élève validé
  static async mettreAJourEleveValide(id: string, updates: Partial<EleveValide>): Promise<EleveValide | null> {
    const index = this.elevesValides.findIndex(eleve => eleve.id === id);
    if (index !== -1) {
      this.elevesValides[index] = { ...this.elevesValides[index], ...updates };
      this.saveToStorage();
      return this.elevesValides[index];
    }
    return null;
  }

  // Vérifier si une demande a été validée
  static async isDemandeValidee(demandeId: string): Promise<boolean> {
    return this.demandesValidees.includes(demandeId);
  }

  // Récupérer les IDs des demandes validées
  static async getDemandesValidees(): Promise<string[]> {
    return [...this.demandesValidees];
  }

  // Obtenir les statistiques des élèves validés
  static async getStatistiquesElevesValides(): Promise<{
    total: number;
    valides: number;
    documentsComplets: number;
    documentsIncomplets: number;
  }> {
    const total = this.elevesValides.length;
    const valides = this.elevesValides.filter(eleve => eleve.status === 'validated').length;
    const documentsComplets = this.elevesValides.filter(eleve => eleve.documentsCount >= 4).length;
    const documentsIncomplets = total - documentsComplets;

    return {
      total,
      valides,
      documentsComplets,
      documentsIncomplets
    };
  }
}

export default ValidationService;
