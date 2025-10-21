// Service de gestion des demandes d'inscription avec mocks
import { DemandeInscription, NouvelleDemande, FiltresDemandes, StatistiquesDemandes } from '../types/inscription';
import ValidationService from './validationService';

// Mock des demandes d'inscription
const mockDemandes: DemandeInscription[] = [
  {
    id: '1',
    numero: 'INS-2024-001',
    eleve: {
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'marie.dupont@email.com',
      phone: '0612345678',
      address: '123 Rue de la Paix, 75001 Paris',
      birthDate: '1990-05-15',
      nationality: 'Gabonaise',
      lieuNaissance: 'Libreville',
      nationaliteEtrangere: ''
    },
    autoEcole: {
      id: '2',
      name: 'Auto-École du Centre',
      email: 'autoecole.centre@email.com'
    },
    dateDemande: '2024-01-15T09:30:00Z',
    statut: 'en_attente',
    documents: [
      {
        id: '1',
        type: 'carte_identite',
        nom: 'Carte d\'identité recto',
        url: '/documents/carte-identite-1.pdf',
        taille: '2.5 MB',
        dateUpload: '2024-01-15T09:30:00Z',
        statut: 'en_attente'
      },
      {
        id: '2',
        type: 'photo',
        nom: 'Photo d\'identité',
        url: '/documents/photo-1.jpg',
        taille: '1.2 MB',
        dateUpload: '2024-01-15T09:35:00Z',
        statut: 'en_attente'
      }
    ],
    commentaires: 'Demande d\'inscription pour permis B'
  },
  {
    id: '2',
    numero: 'INS-2024-002',
    eleve: {
      firstName: 'Jean',
      lastName: 'Ngoma',
      email: 'jean.ngoma@email.com',
      phone: '0698765432',
      address: '456 Avenue des Champs, 75008 Paris',
      birthDate: '1988-12-03',
      nationality: 'Étrangère',
      lieuNaissance: 'Douala',
      nationaliteEtrangere: 'Camerounaise'
    },
    autoEcole: {
      id: '3',
      name: 'Auto-École du Nord',
      email: 'autoecole.nord@email.com'
    },
    dateDemande: '2024-01-16T14:20:00Z',
    statut: 'en_cours',
    documents: [
      {
        id: '3',
        type: 'carte_identite',
        nom: 'Carte d\'identité',
        url: '/documents/carte-identite-2.pdf',
        taille: '2.1 MB',
        dateUpload: '2024-01-16T14:20:00Z',
        statut: 'valide'
      },
      {
        id: '4',
        type: 'certificat_medical',
        nom: 'Certificat médical',
        url: '/documents/certificat-2.pdf',
        taille: '1.8 MB',
        dateUpload: '2024-01-16T14:25:00Z',
        statut: 'valide'
      }
    ],
    traiteePar: 'admin@dgtt.com',
    dateTraitement: '2024-01-17T10:00:00Z'
  }
];

// Mock de la récupération des demandes d'inscription
export async function getDemandesInscriptionMock(filtres?: FiltresDemandes): Promise<DemandeInscription[]> {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      // Récupérer les demandes validées pour les exclure
      const demandesValidees = await ValidationService.getDemandesValidees();
      
      // Filtrer les demandes non validées
      let demandes = mockDemandes.filter(d => !demandesValidees.includes(d.id));
      
      if (filtres) {
        if (filtres.statut) {
          demandes = demandes.filter(d => d.statut === filtres.statut);
        }
        if (filtres.autoEcole) {
          demandes = demandes.filter(d => d.autoEcole.id === filtres.autoEcole);
        }
        if (filtres.recherche) {
          const recherche = filtres.recherche.toLowerCase();
          demandes = demandes.filter(d => 
            d.eleve.firstName.toLowerCase().includes(recherche) ||
            d.eleve.lastName.toLowerCase().includes(recherche) ||
            d.eleve.email.toLowerCase().includes(recherche) ||
            d.numero.toLowerCase().includes(recherche)
          );
        }
      }
      
      resolve(demandes);
    }, 600);
  });
}

// Mock de la récupération d'une demande par ID
export async function getDemandeByIdMock(id: string): Promise<DemandeInscription> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const demande = mockDemandes.find(d => d.id === id);
      if (demande) {
        resolve(demande);
      } else {
        reject(new Error('Demande d\'inscription non trouvée'));
      }
    }, 300);
  });
}

// Mock de la création d'une nouvelle demande
export async function creerDemandeInscriptionMock(nouvelleDemande: NouvelleDemande): Promise<DemandeInscription> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const nouvelleDemandeInscription: DemandeInscription = {
        id: (mockDemandes.length + 1).toString(),
        numero: `INS-2024-${String(mockDemandes.length + 1).padStart(3, '0')}`,
        eleve: nouvelleDemande.eleve,
        autoEcole: {
          id: '2', // Mock auto-école connectée
          name: 'Auto-École du Centre',
          email: 'autoecole.centre@email.com'
        },
        dateDemande: new Date().toISOString(),
        statut: 'en_attente',
        documents: nouvelleDemande.documents.map((file, index) => ({
          id: (index + 1).toString(),
          type: 'carte_identite' as any, // Mock type
          nom: file.name,
          url: `/documents/${file.name}`,
          taille: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          dateUpload: new Date().toISOString(),
          statut: 'en_attente' as any
        })),
        commentaires: nouvelleDemande.commentaires
      };
      
      mockDemandes.push(nouvelleDemandeInscription);
      resolve(nouvelleDemandeInscription);
    }, 800);
  });
}

// Mock de la mise à jour du statut d'une demande
export async function mettreAJourStatutDemandeMock(id: string, statut: string, commentaires?: string): Promise<DemandeInscription> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const demande = mockDemandes.find(d => d.id === id);
      if (demande) {
        demande.statut = statut as any;
        demande.commentaires = commentaires;
        demande.traiteePar = 'admin@dgtt.com';
        demande.dateTraitement = new Date().toISOString();
        resolve(demande);
      } else {
        reject(new Error('Demande d\'inscription non trouvée'));
      }
    }, 500);
  });
}

// Mock de la récupération des statistiques
export async function getStatistiquesDemandesMock(): Promise<StatistiquesDemandes> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stats: StatistiquesDemandes = {
        total: mockDemandes.length,
        enAttente: mockDemandes.filter(d => d.statut === 'en_attente').length,
        enCours: mockDemandes.filter(d => d.statut === 'en_cours').length,
        validees: mockDemandes.filter(d => d.statut === 'validee').length,
        rejetees: mockDemandes.filter(d => d.statut === 'rejetee').length,
        parAutoEcole: mockDemandes.reduce((acc, d) => {
          acc[d.autoEcole.name] = (acc[d.autoEcole.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      resolve(stats);
    }, 400);
  });
}

// Mock de la suppression d'une demande
export async function supprimerDemandeMock(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDemandes.findIndex(d => d.id === id);
      if (index !== -1) {
        mockDemandes.splice(index, 1);
        resolve();
      } else {
        reject(new Error('Demande d\'inscription non trouvée'));
      }
    }, 400);
  });
}

// Version API future (préparée mais commentée)
// export async function getDemandesInscription(filtres?: FiltresDemandes): Promise<DemandeInscription[]> {
//   const { data } = await apiClient.get('/demandes-inscription', { params: filtres });
//   return data;
// }

// export async function creerDemandeInscription(nouvelleDemande: NouvelleDemande): Promise<DemandeInscription> {
//   const { data } = await apiClient.post('/demandes-inscription', nouvelleDemande);
//   return data;
// }
