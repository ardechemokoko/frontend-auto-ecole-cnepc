// Service pour la gestion des candidats aux examens
import { 
  CandidatExamen, 
  CandidatExamenFormData, 
  CandidatExamenFilters, 
  CandidatExamenResponse, 
  CandidatExamenListResponse,
  CandidatExamenStats 
} from '../types';

// Mock des candidats aux examens
const mockCandidatsExamen: CandidatExamen[] = [
  {
    id: '1',
    candidat_id: '1',
    session_examen_id: '1',
    auto_ecole_id: '1',
    formation_id: '1',
    statut: 'inscrit',
    statut_libelle: 'Inscrit',
    date_inscription: '2024-01-15T10:00:00Z',
    commentaires: 'Candidat inscrit pour la session de janvier',
    candidat: {
      id: '1',
      numero_candidat: 'CAND001',
      personne: {
        id: '1',
        nom: 'Dupont',
        prenom: 'Jean',
        nom_complet: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        contact: '+225 07 12 34 56 78',
        adresse: 'Abidjan, Cocody'
      },
      date_naissance: '1995-05-15',
      lieu_naissance: 'Abidjan',
      nationalite: 'Ivoirienne',
      genre: 'M',
      nip: 'NIP001',
      type_piece: 'CNI',
      numero_piece: '123456789'
    },
    session_examen: {
      id: '1',
      nom: 'Session Janvier 2024',
      description: 'Session d\'examen de janvier 2024',
      type_permis_id: '1',
      type_permis: {
        id: '1',
        libelle: 'Permis B',
        code: 'B',
        categorie: 'Voiture',
        description: 'Permis de conduire voiture'
      },
      date_debut: '2024-01-20T08:00:00Z',
      date_fin: '2024-01-25T18:00:00Z',
      statut: 'ouverte',
      statut_libelle: 'Ouverte',
      capacite_maximale: 50,
      capacite_utilisee: 25,
      lieu: 'Centre d\'examen CNEPC',
      adresse: 'Abidjan, Plateau',
      responsable_id: '1',
      responsable: {
        id: '1',
        nom: 'Martin',
        prenom: 'Pierre',
        nom_complet: 'Pierre Martin',
        email: 'pierre.martin@cnepc.ci',
        contact: '+225 07 98 76 54 32',
        fonction: 'Responsable examens'
      },
      epreuves: [],
      candidats: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    auto_ecole: {
      id: '1',
      nom_auto_ecole: 'Auto-École Excellence',
      adresse: 'Abidjan, Cocody',
      email: 'contact@excellence.ci',
      contact: '+225 07 11 22 33 44'
    },
    formation: {
      id: '1',
      nom: 'Formation Permis B',
      description: 'Formation complète pour le permis B',
      type_permis: {
        id: '1',
        libelle: 'Permis B',
        code: 'B'
      },
      montant: 150000,
      montant_formate: '150 000 FCFA'
    },
    epreuves: [],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    candidat_id: '2',
    session_examen_id: '1',
    auto_ecole_id: '2',
    formation_id: '2',
    statut: 'programme',
    statut_libelle: 'Programmé',
    date_inscription: '2024-01-16T14:30:00Z',
    date_examen: '2024-01-22T09:00:00Z',
    commentaires: 'Candidat programmé pour l\'examen théorique',
    candidat: {
      id: '2',
      numero_candidat: 'CAND002',
      personne: {
        id: '2',
        nom: 'Koné',
        prenom: 'Fatou',
        nom_complet: 'Fatou Koné',
        email: 'fatou.kone@email.com',
        contact: '+225 07 55 66 77 88',
        adresse: 'Abidjan, Yopougon'
      },
      date_naissance: '1998-03-22',
      lieu_naissance: 'Bouaké',
      nationalite: 'Ivoirienne',
      genre: 'F',
      nip: 'NIP002',
      type_piece: 'CNI',
      numero_piece: '987654321'
    },
    session_examen: {
      id: '1',
      nom: 'Session Janvier 2024',
      description: 'Session d\'examen de janvier 2024',
      type_permis_id: '1',
      type_permis: {
        id: '1',
        libelle: 'Permis B',
        code: 'B',
        categorie: 'Voiture',
        description: 'Permis de conduire voiture'
      },
      date_debut: '2024-01-20T08:00:00Z',
      date_fin: '2024-01-25T18:00:00Z',
      statut: 'ouverte',
      statut_libelle: 'Ouverte',
      capacite_maximale: 50,
      capacite_utilisee: 25,
      lieu: 'Centre d\'examen CNEPC',
      adresse: 'Abidjan, Plateau',
      responsable_id: '1',
      responsable: {
        id: '1',
        nom: 'Martin',
        prenom: 'Pierre',
        nom_complet: 'Pierre Martin',
        email: 'pierre.martin@cnepc.ci',
        contact: '+225 07 98 76 54 32',
        fonction: 'Responsable examens'
      },
      epreuves: [],
      candidats: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    auto_ecole: {
      id: '2',
      nom_auto_ecole: 'Auto-École Pro',
      adresse: 'Abidjan, Marcory',
      email: 'info@pro.ci',
      contact: '+225 07 99 88 77 66'
    },
    formation: {
      id: '2',
      nom: 'Formation Permis B Accélérée',
      description: 'Formation accélérée pour le permis B',
      type_permis: {
        id: '1',
        libelle: 'Permis B',
        code: 'B'
      },
      montant: 180000,
      montant_formate: '180 000 FCFA'
    },
    epreuves: [],
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z'
  }
];

// Service pour la gestion des candidats aux examens
export class CandidatExamenService {
  // Récupérer la liste des candidats aux examens
  static async getCandidatsExamen(filters?: CandidatExamenFilters): Promise<CandidatExamenListResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredCandidats = [...mockCandidatsExamen];

        // Appliquer les filtres
        if (filters) {
          if (filters.session_examen_id) {
            filteredCandidats = filteredCandidats.filter(
              c => c.session_examen_id === filters.session_examen_id
            );
          }
          if (filters.auto_ecole_id) {
            filteredCandidats = filteredCandidats.filter(
              c => c.auto_ecole_id === filters.auto_ecole_id
            );
          }
          if (filters.statut) {
            filteredCandidats = filteredCandidats.filter(
              c => c.statut === filters.statut
            );
          }
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredCandidats = filteredCandidats.filter(c =>
              c.candidat.personne.nom.toLowerCase().includes(searchLower) ||
              c.candidat.personne.prenom.toLowerCase().includes(searchLower) ||
              c.candidat.numero_candidat.toLowerCase().includes(searchLower)
            );
          }
        }

        resolve({
          data: filteredCandidats,
          links: {
            first: '/api/candidats-examen?page=1',
            last: '/api/candidats-examen?page=1',
            prev: null,
            next: null
          },
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            path: '/api/candidats-examen',
            per_page: 15,
            to: filteredCandidats.length,
            total: filteredCandidats.length
          }
        });
      }, 500);
    });
  }

  // Récupérer un candidat aux examens par ID
  static async getCandidatExamenById(id: string): Promise<CandidatExamen> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const candidat = mockCandidatsExamen.find(c => c.id === id);
        if (candidat) {
          resolve(candidat);
        } else {
          reject(new Error('Candidat aux examens non trouvé'));
        }
      }, 300);
    });
  }

  // Créer un nouveau candidat aux examens
  static async createCandidatExamen(data: CandidatExamenFormData): Promise<CandidatExamenResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCandidat: CandidatExamen = {
          id: (mockCandidatsExamen.length + 1).toString(),
          ...data,
          statut: 'inscrit',
          statut_libelle: 'Inscrit',
          date_inscription: new Date().toISOString(),
          candidat: {
            id: data.candidat_id,
            numero_candidat: 'CAND' + String(mockCandidatsExamen.length + 1).padStart(3, '0'),
            personne: {
              id: '1',
              nom: 'Nouveau',
              prenom: 'Candidat',
              nom_complet: 'Nouveau Candidat',
              email: 'nouveau@email.com',
              contact: '+225 07 00 00 00 00',
              adresse: 'Adresse'
            },
            date_naissance: '1990-01-01',
            lieu_naissance: 'Abidjan',
            nationalite: 'Ivoirienne',
            genre: 'M',
            nip: 'NIP' + String(mockCandidatsExamen.length + 1).padStart(3, '0'),
            type_piece: 'CNI',
            numero_piece: '000000000'
          },
          session_examen: {
            id: data.session_examen_id,
            nom: 'Session',
            description: 'Description',
            type_permis_id: '1',
            type_permis: {
              id: '1',
              libelle: 'Permis B',
              code: 'B',
              categorie: 'Voiture',
              description: 'Permis de conduire voiture'
            },
            date_debut: '2024-01-20T08:00:00Z',
            date_fin: '2024-01-25T18:00:00Z',
            statut: 'ouverte',
            statut_libelle: 'Ouverte',
            capacite_maximale: 50,
            capacite_utilisee: 25,
            lieu: 'Centre d\'examen',
            adresse: 'Adresse',
            responsable_id: '1',
            responsable: {
              id: '1',
              nom: 'Responsable',
              prenom: 'Test',
              nom_complet: 'Test Responsable',
              email: 'responsable@test.ci',
              contact: '+225 07 00 00 00 00',
              fonction: 'Responsable'
            },
            epreuves: [],
            candidats: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          auto_ecole: {
            id: data.auto_ecole_id,
            nom_auto_ecole: 'Auto-École',
            adresse: 'Adresse',
            email: 'contact@autoecole.ci',
            contact: '+225 07 00 00 00 00'
          },
          formation: {
            id: data.formation_id,
            nom: 'Formation',
            description: 'Description formation',
            type_permis: {
              id: '1',
              libelle: 'Permis B',
              code: 'B'
            },
            montant: 150000,
            montant_formate: '150 000 FCFA'
          },
          epreuves: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        mockCandidatsExamen.push(newCandidat);

        resolve({
          success: true,
          message: 'Candidat aux examens créé avec succès',
          data: newCandidat
        });
      }, 800);
    });
  }

  // Mettre à jour un candidat aux examens
  static async updateCandidatExamen(id: string, data: Partial<CandidatExamenFormData>): Promise<CandidatExamenResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockCandidatsExamen.findIndex(c => c.id === id);
        if (index !== -1) {
          mockCandidatsExamen[index] = {
            ...mockCandidatsExamen[index],
            ...data,
            updated_at: new Date().toISOString()
          };

          resolve({
            success: true,
            message: 'Candidat aux examens mis à jour avec succès',
            data: mockCandidatsExamen[index]
          });
        } else {
          reject(new Error('Candidat aux examens non trouvé'));
        }
      }, 600);
    });
  }

  // Supprimer un candidat aux examens
  static async deleteCandidatExamen(id: string): Promise<CandidatExamenResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockCandidatsExamen.findIndex(c => c.id === id);
        if (index !== -1) {
          mockCandidatsExamen.splice(index, 1);
          resolve({
            success: true,
            message: 'Candidat aux examens supprimé avec succès'
          });
        } else {
          reject(new Error('Candidat aux examens non trouvé'));
        }
      }, 400);
    });
  }

  // Changer le statut d'un candidat aux examens
  static async updateStatutCandidatExamen(id: string, statut: string): Promise<CandidatExamenResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const candidat = mockCandidatsExamen.find(c => c.id === id);
        if (candidat) {
          candidat.statut = statut as any;
          candidat.statut_libelle = this.getStatutLabel(statut);
          candidat.updated_at = new Date().toISOString();

          resolve({
            success: true,
            message: 'Statut mis à jour avec succès',
            data: candidat
          });
        } else {
          reject(new Error('Candidat aux examens non trouvé'));
        }
      }, 500);
    });
  }

  // Récupérer les statistiques des candidats aux examens
  static async getCandidatExamenStats(filters?: CandidatExamenFilters): Promise<CandidatExamenStats> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let candidats = [...mockCandidatsExamen];

        // Appliquer les filtres
        if (filters) {
          if (filters.session_examen_id) {
            candidats = candidats.filter(c => c.session_examen_id === filters.session_examen_id);
          }
          if (filters.auto_ecole_id) {
            candidats = candidats.filter(c => c.auto_ecole_id === filters.auto_ecole_id);
          }
        }

        const total = candidats.length;
        const inscrits = candidats.filter(c => c.statut === 'inscrit').length;
        const programmes = candidats.filter(c => c.statut === 'programme').length;
        const presents = candidats.filter(c => c.statut === 'present').length;
        const absents = candidats.filter(c => c.statut === 'absent').length;
        const reussis = candidats.filter(c => c.statut === 'reussi').length;
        const echoues = candidats.filter(c => c.statut === 'echoue').length;
        const annules = candidats.filter(c => c.statut === 'annule').length;

        const taux_reussite = reussis + echoues > 0 ? (reussis / (reussis + echoues)) * 100 : 0;
        const taux_presence = presents + absents > 0 ? (presents / (presents + absents)) * 100 : 0;

        resolve({
          total,
          inscrits,
          programmes,
          presents,
          absents,
          reussis,
          echoues,
          annules,
          taux_reussite,
          taux_presence
        });
      }, 300);
    });
  }

  // Méthode utilitaire pour obtenir le libellé du statut
  private static getStatutLabel(statut: string): string {
    const statuts: Record<string, string> = {
      'inscrit': 'Inscrit',
      'en_attente': 'En attente',
      'programme': 'Programmé',
      'present': 'Présent',
      'absent': 'Absent',
      'reussi': 'Réussi',
      'echoue': 'Échoué',
      'annule': 'Annulé'
    };
    return statuts[statut] || statut;
  }
}
