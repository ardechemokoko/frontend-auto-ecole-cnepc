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

  // Valider une demande et la transférer vers les élèves validés
  static async validerDemande(demande: DemandeInscription): Promise<EleveValide> {
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
      documentsCount: demande.documents.length,
      validatedAt: new Date().toISOString(),
      demandeId: demande.id,
      originalDocuments: demande.documents, // Transmettre les documents de la demande
      autoEcole: demande.autoEcole
    };

    // Ajouter à la liste des élèves validés
    this.elevesValides.push(nouvelEleve);

    // Marquer la demande comme validée
    this.demandesValidees.push(demande.id);

    // Simuler une mise à jour de la demande (marquer comme validée)
    console.log('Demande validée et transférée:', nouvelEleve);

    return nouvelEleve;
  }

  // Récupérer tous les élèves validés
  static async getElevesValides(): Promise<EleveValide[]> {
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
      return true;
    }
    return false;
  }

  // Mettre à jour un élève validé
  static async mettreAJourEleveValide(id: string, updates: Partial<EleveValide>): Promise<EleveValide | null> {
    const index = this.elevesValides.findIndex(eleve => eleve.id === id);
    if (index !== -1) {
      this.elevesValides[index] = { ...this.elevesValides[index], ...updates };
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
