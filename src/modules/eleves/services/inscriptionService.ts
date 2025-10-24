// Service de gestion des demandes d'inscription - API réelle
import { DemandeInscription, FiltresDemandes, StatistiquesDemandes } from '../types/inscription';
import axiosClient from '../../../shared/environment/envdev';

/**
 * Mapper les données de l'API vers le format DemandeInscription
 */
function mapDossierToDemandeInscription(dossier: any): DemandeInscription {
  return {
    id: dossier.id,
    numero: dossier.candidat?.numero_candidat || 'N/A',
    eleve: {
      firstName: dossier.candidat?.personne?.prenom || '',
      lastName: dossier.candidat?.personne?.nom || '',
      email: dossier.candidat?.personne?.email || '',
      phone: dossier.candidat?.personne?.contact || '',
      address: dossier.candidat?.personne?.adresse || '',
      birthDate: dossier.candidat?.date_naissance || '',
      nationality: dossier.candidat?.nationalite || '',
      lieuNaissance: dossier.candidat?.lieu_naissance || '',
      nationaliteEtrangere: ''
    },
    autoEcole: {
      id: dossier.auto_ecole_id || '',
      name: dossier.formation?.autoEcole?.nom_auto_ecole || 'Auto-École',
      email: dossier.formation?.autoEcole?.email || ''
    },
    dateDemande: dossier.date_creation || dossier.created_at,
    statut: dossier.statut,
    documents: (dossier.documents || []).map((doc: any) => ({
      id: doc.id,
      type: doc.type || 'autre',
      nom: doc.nom || doc.nom_fichier || 'Document',
      url: doc.chemin_fichier || '',
      taille: doc.taille_fichier ? `${(doc.taille_fichier / 1024 / 1024).toFixed(1)} MB` : 'N/A',
      dateUpload: doc.date_upload || doc.created_at,
      statut: doc.statut || 'en_attente'
    })),
    commentaires: dossier.commentaires || '',
    traiteePar: dossier.traite_par,
    dateTraitement: dossier.date_modification
  };
}

/**
 * Récupérer tous les dossiers de l'auto-école connectée
 * Endpoint: GET /api/auto-ecoles/mes-dossiers
 */
export async function getDemandesInscription(filtres?: FiltresDemandes): Promise<DemandeInscription[]> {
  try {
    console.log('📋 Récupération des dossiers de l\'auto-école...', filtres);
    
    // Construire les paramètres de requête
    const params: any = {};
    if (filtres?.statut) {
      params.statut = filtres.statut;
    }
    
    const response = await axiosClient.get('/auto-ecoles/mes-dossiers', { params });
    
    console.log('✅ Dossiers récupérés:', {
      total: response.data.dossiers?.length || 0,
      auto_ecole: response.data.auto_ecole?.nom_auto_ecole
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des dossiers');
    }
    
    // Mapper les dossiers vers le format DemandeInscription
    let demandes = (response.data.dossiers || []).map(mapDossierToDemandeInscription);
    
    // Filtrer côté client si nécessaire
    if (filtres?.recherche) {
      const recherche = filtres.recherche.toLowerCase();
      demandes = demandes.filter((d: DemandeInscription) => 
        d.eleve.firstName.toLowerCase().includes(recherche) ||
        d.eleve.lastName.toLowerCase().includes(recherche) ||
        d.eleve.email.toLowerCase().includes(recherche) ||
        d.numero.toLowerCase().includes(recherche)
      );
    }
    
    return demandes;
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des dossiers:', error);
    
    if (error.response) {
      console.error('Statut:', error.response.status);
      console.error('Message:', error.response.data?.message);
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Erreur lors de la récupération des dossiers');
  }
}

// Alias pour compatibilité
export const getDemandesInscriptionMock = getDemandesInscription;

/**
 * Récupérer un dossier spécifique par son ID
 * Endpoint: GET /api/dossiers/{id}
 */
export async function getDemandeById(id: string): Promise<DemandeInscription> {
  try {
    console.log('🔍 Récupération du dossier:', id);
    
    const response = await axiosClient.get(`/dossiers/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Dossier non trouvé');
    }
    
    console.log('✅ Dossier récupéré:', response.data.data.id);
    
    return mapDossierToDemandeInscription(response.data.data);
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération du dossier:', error);
    throw new Error(error.response?.data?.message || 'Dossier non trouvé');
  }
}

// Alias pour compatibilité
export const getDemandeByIdMock = getDemandeById;

/**
 * NOTE: La création de dossiers se fait maintenant via NouvelleDemandeForm.tsx
 * qui utilise directement candidatService pour le flux complet
 */

/**
 * Mettre à jour le statut d'un dossier
 * Endpoint: PUT /api/dossiers/{id}
 */
export async function mettreAJourStatutDemande(
  id: string, 
  statut: string, 
  commentaires?: string
): Promise<DemandeInscription> {
  try {
    console.log('📝 Mise à jour du statut du dossier:', { id, statut });
    
    const response = await axiosClient.put(`/dossiers/${id}`, {
      statut,
      commentaires
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la mise à jour');
    }
    
    console.log('✅ Statut mis à jour');
    
    return mapDossierToDemandeInscription(response.data.data);
  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du dossier');
  }
}

// Alias pour compatibilité
export const mettreAJourStatutDemandeMock = mettreAJourStatutDemande;

/**
 * Récupérer les statistiques des dossiers de l'auto-école
 * Utilise les données de GET /api/auto-ecoles/mes-dossiers
 */
export async function getStatistiquesDemandes(): Promise<StatistiquesDemandes> {
  try {
    console.log('📊 Récupération des statistiques...');
    
    const response = await axiosClient.get('/auto-ecoles/mes-dossiers');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques');
    }
    
    const statistiques = response.data.statistiques || {
      total: 0,
      en_attente: 0,
      en_cours: 0,
      valide: 0,
      rejete: 0
    };
    
    const stats: StatistiquesDemandes = {
      total: statistiques.total,
      enAttente: statistiques.en_attente,
      enCours: statistiques.en_cours,
      validees: statistiques.valide,
      rejetees: statistiques.rejete,
      parAutoEcole: {
        [response.data.auto_ecole?.nom_auto_ecole || 'Auto-École']: statistiques.total
      }
    };
    
    console.log('✅ Statistiques récupérées:', stats);
    
    return stats;
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    
    // Retourner des statistiques vides en cas d'erreur
    return {
      total: 0,
      enAttente: 0,
      enCours: 0,
      validees: 0,
      rejetees: 0,
      parAutoEcole: {}
    };
  }
}

// Alias pour compatibilité
export const getStatistiquesDemandesMock = getStatistiquesDemandes;

/**
 * Supprimer un dossier
 * Endpoint: DELETE /api/dossiers/{id}
 */
export async function supprimerDemande(id: string): Promise<void> {
  try {
    console.log('🗑️ Suppression du dossier:', id);
    
    const response = await axiosClient.delete(`/dossiers/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erreur lors de la suppression');
    }
    
    console.log('✅ Dossier supprimé');
  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du dossier');
  }
}

// Alias pour compatibilité
export const supprimerDemandeMock = supprimerDemande;
