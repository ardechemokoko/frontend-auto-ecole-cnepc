import { useState, useEffect } from 'react';
import { ReceptionDossier, EpreuveStatut, EpreuveAttempt } from '../types';
import axiosClient from '../../../shared/environment/envdev';
import { circuitSuiviService, CircuitSuivi } from '../services/circuit-suivi.service';
import { typeDemandeService } from '../../cnepc/services';

// Fonctions de calcul du statut
const MAX_ATTEMPTS = 3;

function computeOverall(attempts?: EpreuveAttempt[], legacy?: EpreuveStatut): EpreuveStatut {
  if (legacy && legacy !== 'non_saisi') return legacy;
  if (!attempts || attempts.length === 0) return 'non_saisi';
  if (attempts.some(a => a.result === 'reussi')) return 'reussi';
  if (attempts.length >= MAX_ATTEMPTS && attempts.every(a => a.result !== 'reussi')) return 'echoue';
  return attempts[attempts.length - 1].result;
}

function computeGeneral(
  creneaux: EpreuveStatut,
  codeConduite: EpreuveStatut,
  tourVille: EpreuveStatut
): EpreuveStatut {
  const statuses: EpreuveStatut[] = [creneaux, codeConduite, tourVille];
  
  if (statuses.every(s => s === 'reussi')) return 'reussi';
  if (statuses.some(s => s === 'echoue')) return 'echoue';
  if (statuses.some(s => s === 'absent')) return 'absent';
  
  return 'non_saisi';
}

export const useReceptionCandidatDetails = (id: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [dossierComplet, setDossierComplet] = useState<any>(null);
  const [dossier, setDossier] = useState<ReceptionDossier | null>(null);
  const [epreuvesStatus, setEpreuvesStatus] = useState<EpreuveStatut | null>(null);
  const [loadingEpreuves, setLoadingEpreuves] = useState(false);
  const [circuit, setCircuit] = useState<CircuitSuivi | null>(null);
  const [loadingCircuit, setLoadingCircuit] = useState(false);
  const [typeDocuments, setTypeDocuments] = useState<any[]>([]);
  const [loadingTypeDocuments, setLoadingTypeDocuments] = useState(false);
  const [documentsFromApi, setDocumentsFromApi] = useState<any[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour charger le dossier complet
  const chargerDossierComplet = async () => {
    if (!id) return;

    try {
      setLoading(true);
      console.log('📋 Chargement du dossier:', id);
      
      // Utiliser directement l'endpoint /dossiers/{id}
      let dossierData: any = null;
      let typeDemandeName = '';
      
      try {
        const response = await axiosClient.get(`/dossiers/${id}`);
        dossierData = response.data?.data || response.data;
        console.log('✅ Dossier récupéré depuis /dossiers/{id}');
      } catch (error: any) {
        // Si 404, essayer de récupérer depuis la liste /dossiers comme fallback
        if (error?.response?.status === 404) {
          console.log('⚠️ Dossier non trouvé via /dossiers/{id}, tentative depuis la liste...');
          try {
            const listResponse = await axiosClient.get('/dossiers');
            let dossiersList: any[] = [];
            if (Array.isArray(listResponse.data)) {
              dossiersList = listResponse.data;
            } else if (listResponse.data?.data && Array.isArray(listResponse.data.data)) {
              dossiersList = listResponse.data.data;
            } else if (listResponse.data?.success && Array.isArray(listResponse.data.data)) {
              dossiersList = listResponse.data.data;
            }
            
            dossierData = dossiersList.find((d: any) => 
              d.reference === id || 
              d.id === id ||
              d.reference?.toUpperCase() === id.toUpperCase() ||
              d.id?.toUpperCase() === id.toUpperCase()
            );
            
            if (!dossierData) {
              throw new Error('Dossier non trouvé');
            }
            console.log('✅ Dossier trouvé dans la liste');
          } catch (listError: any) {
            console.error('❌ Impossible de récupérer le dossier:', listError);
            throw new Error('Dossier non trouvé ou non accessible');
          }
        } else {
          throw error;
        }
      }
      
      // Vérifier le type de demande
      if (dossierData?.type_demande_id) {
        try {
          const typeDemande = await typeDemandeService.getTypeDemandeById(dossierData.type_demande_id);
          typeDemandeName = typeDemande.name || '';
          console.log('📋 Type de demande:', typeDemandeName);
        } catch (err) {
          console.warn('⚠️ Impossible de charger le type de demande:', err);
        }
      }
      
      // Si le type de demande n'est pas "NOUVEAU PERMIS", ne pas charger les détails complets
      const isPermisType = typeDemandeName && (
        typeDemandeName.toUpperCase().includes('PERMIS') || 
        typeDemandeName.toUpperCase().includes('NOUVEAU') ||
        typeDemandeName.toUpperCase() === 'PERMIS_CONDUIRE'
      );
      
      if (!isPermisType) {
        console.log('ℹ️ Type de demande non-permis, utilisation des données de base uniquement (pas d\'auto-école/formation/épreuves)');
      }
      
      setDossierComplet(dossierData);
      
      const receptionDossier: ReceptionDossier = {
        id: dossierData.id,
        reference: dossierData.reference || id,
        candidatNom: dossierData.candidat?.personne?.nom || dossierData.candidat_nom || 'N/A',
        candidatPrenom: dossierData.candidat?.personne?.prenom || dossierData.candidat_prenom || 'N/A',
        autoEcoleNom: dossierData.auto_ecole?.nom_auto_ecole || dossierData.auto_ecole_nom || 'N/A',
        dateEnvoi: dossierData.date_creation || dossierData.created_at || new Date().toISOString(),
        statut: (dossierData.statut || 'en_attente') as ReceptionDossier['statut'],
        details: {
          dossier_complet: dossierData,
          formation_complete: dossierData.formation || null,
          candidat_complet: dossierData.candidat || null
        },
        epreuves: dossierData.epreuves || { general: 'non_saisi' }
      };
      
      setDossier(receptionDossier);
      
      console.log('✅ Dossier chargé:', receptionDossier.reference);
      
      // Retourner les données du dossier pour les utiliser dans le chargement du circuit
      // Cela évite les problèmes de synchronisation d'état
      
      if (dossierData?.documents && Array.isArray(dossierData.documents) && dossierData.documents.length > 0) {
        const mappedFromDossier = dossierData.documents.map((doc: any) => ({
          id: doc.id,
          nom: doc.nom_fichier || doc.nom,
          nom_fichier: doc.nom_fichier || doc.nom,
          chemin_fichier: doc.chemin_fichier,
          url: doc.chemin_fichier,
          taille: doc.taille_fichier_formate || formatFileSize(doc.taille_fichier || 0),
          taille_fichier: doc.taille_fichier,
          type_mime: doc.type_mime,
          type: doc.type_mime,
          valide: doc.valide,
          valide_libelle: doc.valide_libelle || (doc.valide ? 'Validé' : 'Non validé'),
          dateUpload: doc.created_at || doc.date_upload,
          created_at: doc.created_at,
          commentaires: doc.commentaires,
          type_document_id: doc.type_document_id || doc.type_document?.id // ← Clé de corrélation selon CORRELATION_DOCUMENTS_PIECES.md
        }));
        
        console.log('✅ Documents chargés depuis dossier complet:', mappedFromDossier.length);
        console.log('📋 Documents avec type_document_id:', mappedFromDossier.filter(d => d.type_document_id).length);
        mappedFromDossier.forEach(doc => {
          if (!doc.type_document_id) {
            console.warn('⚠️ Document sans type_document_id:', doc.id, doc.nom);
          }
        });
        
        setDocumentsFromApi(mappedFromDossier);
      }
      
      // Retourner les données du dossier pour les utiliser dans le chargement du circuit
      return dossierData;
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement du dossier:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger le statut des épreuves
  const chargerEpreuvesStatus = async () => {
    if (!id) return;
    
    // Ne charger les épreuves que si le dossier a un type de demande permis
    if (!dossierComplet?.type_demande_id) {
      console.log('ℹ️ Pas de type_demande_id, pas de chargement des épreuves');
      setEpreuvesStatus('non_saisi');
      return;
    }
    
    try {
      setLoadingEpreuves(true);
      
      // Vérifier le type de demande
      const typeDemande = await typeDemandeService.getTypeDemandeById(dossierComplet.type_demande_id);
      const isPermisType = typeDemande.name && (
        typeDemande.name.toUpperCase().includes('PERMIS') || 
        typeDemande.name.toUpperCase().includes('NOUVEAU') ||
        typeDemande.name.toUpperCase() === 'PERMIS_CONDUIRE'
      );
      
      if (!isPermisType) {
        console.log('ℹ️ Type de demande non-permis, pas de chargement des épreuves');
        setEpreuvesStatus('non_saisi');
        setLoadingEpreuves(false);
        return;
      }
      
      if (dossier?.epreuves?.general) {
        setEpreuvesStatus(dossier.epreuves.general);
        setLoadingEpreuves(false);
        return;
      }
      
      const response = await axiosClient.get('/resultats', {
        params: { dossier_id: id }
      });
      
      const resultats = Array.isArray(response.data?.data) ? response.data.data : [];
      
      if (resultats.length === 0) {
        setEpreuvesStatus('non_saisi');
        return;
      }
      
      const creneauxAttempts: EpreuveAttempt[] = [];
      const codeConduiteAttempts: EpreuveAttempt[] = [];
      const tourVilleAttempts: EpreuveAttempt[] = [];
      
      resultats.forEach((resultat: any) => {
        const attempt: EpreuveAttempt = {
          result: resultat.statut as EpreuveStatut,
          date: resultat.date,
          note: resultat.commentaire || ''
        };
        
        const typeExamen = (resultat.typeExamen || '').toLowerCase().trim();
        
        if (typeExamen.includes('creneau') || typeExamen === 'creneaux') {
          creneauxAttempts.push(attempt);
        } else if (typeExamen.includes('code') || typeExamen === 'codeconduite' || typeExamen === 'code_conduite') {
          codeConduiteAttempts.push(attempt);
        } else if (typeExamen.includes('ville') || typeExamen === 'tourville' || typeExamen === 'tour_ville') {
          tourVilleAttempts.push(attempt);
        }
      });
      
      creneauxAttempts.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      codeConduiteAttempts.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      tourVilleAttempts.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      
      const creneauxStatus = computeOverall(creneauxAttempts);
      const codeStatus = computeOverall(codeConduiteAttempts);
      const villeStatus = computeOverall(tourVilleAttempts);
      const generalStatus = computeGeneral(creneauxStatus, codeStatus, villeStatus);
      
      setEpreuvesStatus(generalStatus);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement du statut des épreuves:', err);
      if (err?.response?.status === 404) {
        setEpreuvesStatus('non_saisi');
      } else {
        setEpreuvesStatus(null);
      }
    } finally {
      setLoadingEpreuves(false);
    }
  };

  // Fonction pour charger les référentiels (toujours nécessaire pour identifier les pièces)
  const chargerReferentiels = async () => {
    try {
      setLoadingTypeDocuments(true);

      let page = 1;
      let allTypes: any[] = [];
      let hasMore = true;

      // Charger les référentiels de type 'type_piece' (pièces justificatives)
      while (hasMore) {
        const response = await axiosClient.get('/referentiels', {
          params: {
            page,
            per_page: 100,
            type_ref: 'type_piece'
          }
        });

        const data = response.data?.data || response.data || [];
        const types = Array.isArray(data) ? data : [];
        allTypes = [...allTypes, ...types];

        hasMore = types.length === 100;
        page++;
      }

      // Charger aussi les référentiels de type 'type_document' au cas où
      page = 1;
      hasMore = true;
      while (hasMore) {
        try {
          const response = await axiosClient.get('/referentiels', {
            params: {
              page,
              per_page: 100,
              type_ref: 'type_document'
            }
          });

          const data = response.data?.data || response.data || [];
          const types = Array.isArray(data) ? data : [];
          
          // Ajouter seulement ceux qui ne sont pas déjà dans allTypes
          types.forEach((type: any) => {
            if (!allTypes.find(t => t.id === type.id)) {
              allTypes.push(type);
            }
          });

          hasMore = types.length === 100;
          page++;
        } catch (err) {
          console.warn('⚠️ Erreur lors du chargement des référentiels type_document:', err);
          hasMore = false;
        }
      }

      console.log('✅ Référentiels chargés:', allTypes.length, 'types');
      setTypeDocuments(allTypes);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des référentiels:', err);
    } finally {
      setLoadingTypeDocuments(false);
    }
  };

  // Fonction pour charger le circuit
  const chargerCircuit = async (dossierData?: any) => {
    try {
      setLoadingCircuit(true);
      console.log('🔄 Début du chargement du circuit...');

      // Utiliser les données passées en paramètre ou celles de l'état
      const dossierDataToUse = dossierData || dossierComplet;
      const dossierToUse = dossier;

      let circuitData: CircuitSuivi | null = null;

      // Méthode 1: Utiliser le circuit déjà présent dans le dossier
      if (dossierDataToUse?.circuit) {
        circuitData = dossierDataToUse.circuit;
        console.log('✅ Circuit trouvé dans le dossier complet');
      }
      // Méthode 2: Utiliser type_demande_id si disponible
      else if (dossierDataToUse?.type_demande_id) {
        console.log('📋 Type demande ID:', dossierDataToUse.type_demande_id);
        
        const typeDemande = await typeDemandeService.getTypeDemandeById(dossierDataToUse.type_demande_id);
        console.log('📋 Type demande:', typeDemande);
        
        if (typeDemande?.name) {
          const nomEntite = typeDemande.name;
          console.log('📋 Nom entité:', nomEntite);
          circuitData = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
        }
      }
      // Méthode 3: Utiliser type_demande.name directement si disponible
      else if (dossierDataToUse?.type_demande?.name) {
        const nomEntite = dossierDataToUse.type_demande.name;
        console.log('📋 Nom entité depuis type_demande:', nomEntite);
        circuitData = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
      }
      // Méthode 4: Utiliser le dossier de base si disponible
      else if (dossierToUse?.details?.dossier_complet) {
        const dossierBase = dossierToUse.details.dossier_complet;
        if (dossierBase.circuit) {
          circuitData = dossierBase.circuit;
          console.log('✅ Circuit trouvé dans dossier.details.dossier_complet');
        } else if (dossierBase.type_demande_id) {
          try {
            const typeDemande = await typeDemandeService.getTypeDemandeById(dossierBase.type_demande_id);
            if (typeDemande?.name) {
              circuitData = await circuitSuiviService.getCircuitByNomEntite(typeDemande.name);
              console.log('✅ Circuit chargé via dossier.details.type_demande_id');
            }
          } catch (err) {
            console.warn('⚠️ Impossible de charger le type de demande depuis dossier.details:', err);
          }
        }
      }
      // Méthode 5: Fallback - utiliser le circuit unique si un seul existe
      if (!circuitData) {
        console.log('⚠️ Tentative de chargement du circuit par défaut (unique disponible)...');
        try {
          const circuits = await circuitSuiviService.getCircuits();
          const circuitsActifs = circuits.filter(c => c.actif);
          if (circuitsActifs.length === 1) {
            circuitData = circuitsActifs[0];
            console.log('✅ Circuit par défaut utilisé (unique disponible):', circuitData.libelle);
          }
        } catch (err) {
          console.warn('⚠️ Impossible de charger les circuits pour le fallback:', err);
        }
      }
      
      if (circuitData) {
        console.log('✅ Circuit chargé:', {
          id: circuitData.id,
          libelle: circuitData.libelle,
          nom_entite: circuitData.nom_entite,
          etapesCount: circuitData.etapes?.length || 0,
          etapes: circuitData.etapes
        });
        
        // Si le circuit n'a pas d'étapes, les charger séparément selon CIRCUIT_SUIVI_SERVICE.md
        if (circuitData.id && (!circuitData.etapes || circuitData.etapes.length === 0)) {
          console.log('⚠️ Circuit sans étapes, chargement depuis l\'API...');
          try {
            const etapes = await circuitSuiviService.getEtapesByCircuitId(circuitData.id);
            if (etapes.length > 0) {
              circuitData.etapes = etapes;
              console.log('✅ Étapes chargées et ajoutées au circuit:', etapes.length);
            }
          } catch (err: any) {
            console.warn('⚠️ Impossible de charger les étapes:', err.message);
          }
        }
        
        setCircuit(circuitData);
      } else {
        console.warn('⚠️ Aucun circuit trouvé avec les méthodes disponibles');
        console.log('📋 Dossier complet utilisé:', dossierDataToUse);
        console.log('📋 Dossier utilisé:', dossierToUse);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement du circuit:', err);
      console.error('❌ Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoadingCircuit(false);
    }
  };

  // Fonction pour charger le circuit et les types de documents
  const chargerCircuitEtTypesDocuments = async (dossierData?: any) => {
    // Toujours charger les référentiels (nécessaires pour identifier les pièces)
    await chargerReferentiels();
    
    // Charger le circuit (essaie plusieurs méthodes de fallback)
    // Passer les données du dossier directement pour éviter les problèmes de synchronisation d'état
    await chargerCircuit(dossierData);
  };

  // Fonction pour charger les documents depuis l'API
  const chargerDocuments = async () => {
    if (!id) return;

    try {
      setLoadingDocuments(true);
      
      // Utiliser les mêmes paramètres que circuit-suivi.service.ts pour filtrer par dossier spécifique
      const response = await axiosClient.get('/documents', {
        params: { 
          documentable_id: id,
          documentable_type: 'App\\Models\\Dossier'
        }
      });

      let documents: any[] = [];
      
      if (response.data.success) {
        if (response.data.data) {
          documents = Array.isArray(response.data.data) 
            ? response.data.data 
            : [response.data.data];
        } else if (Array.isArray(response.data)) {
          documents = response.data;
        } else if (response.data.documents) {
          documents = Array.isArray(response.data.documents) 
            ? response.data.documents 
            : [response.data.documents];
        }
      } else if (Array.isArray(response.data)) {
        documents = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        documents = response.data.data;
      }

      if (documents.length > 0) {
        const mappedDocuments = documents.map((doc: any) => ({
          id: doc.id,
          nom: doc.nom_fichier || doc.nom,
          nom_fichier: doc.nom_fichier || doc.nom,
          chemin_fichier: doc.chemin_fichier,
          url: doc.chemin_fichier,
          taille: doc.taille_fichier_formate || formatFileSize(doc.taille_fichier || 0),
          taille_fichier: doc.taille_fichier,
          type_mime: doc.type_mime,
          type: doc.type_mime,
          valide: doc.valide,
          valide_libelle: doc.valide_libelle || (doc.valide ? 'Validé' : 'Non validé'),
          dateUpload: doc.created_at || doc.date_upload,
          created_at: doc.created_at,
          commentaires: doc.commentaires,
          type_document_id: doc.type_document_id, // ← Clé de corrélation secondaire (fallback)
          piece_justification_id: doc.piece_justification_id || null, // ← Clé de corrélation principale selon LIAISON_PIECE_DOCUMENT.md
          documentable_id: doc.documentable_id || id, // ← ID du dossier (CRITIQUE pour le filtrage)
          documentable_type: doc.documentable_type || 'App\\Models\\Dossier' // ← Type du documentable
        }));

        console.log('✅ Documents chargés depuis /documents pour dossier:', id, mappedDocuments.length);
        console.log('📋 Documents avec type_document_id:', mappedDocuments.filter(d => d.type_document_id).length);
        console.log('📋 Documents avec piece_justification_id:', mappedDocuments.filter(d => d.piece_justification_id).length);
        console.log('📋 Documents avec documentable_id:', mappedDocuments.filter(d => d.documentable_id).length);
        console.log('📋 Documents avec documentable_id correspondant au dossier:', mappedDocuments.filter(d => d.documentable_id === id).length);
        
        // Log des documents pour débogage
        mappedDocuments.forEach(doc => {
          if (!doc.piece_justification_id && !doc.type_document_id) {
            console.warn('⚠️ Document sans piece_justification_id ni type_document_id:', doc.id, doc.nom, 'documentable_id:', doc.documentable_id, 'Données complètes:', doc);
          } else {
            console.log('✅ Document:', doc.nom, {
              piece_justification_id: doc.piece_justification_id || 'N/A',
              type_document_id: doc.type_document_id || 'N/A',
              documentable_id: doc.documentable_id || 'N/A',
              correspond_au_dossier: doc.documentable_id === id
            });
          }
        });
        
        // Remplacer les documents existants par les nouveaux (mise à jour complète)
        // Cela évite les doublons et garantit que les données sont à jour
        setDocumentsFromApi(mappedDocuments);
      } else {
        console.log('⚠️ Aucun document trouvé dans la réponse API');
        // Ne pas écraser les documents existants si la réponse est vide
        // setDocumentsFromApi([]); // Commenté pour préserver les documents existants
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      // Ne pas écraser les documents existants en cas d'erreur
      // setDocumentsFromApi([]); // Commenté pour préserver les documents existants
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fonction pour obtenir les documents d'une pièce justificative
  // Selon LIAISON_PIECE_DOCUMENT.md : piece.type_document = PieceJustificative.id
  // IMPORTANT: Filtrer uniquement les documents du dossier actuel (id)
  const getDocumentsByPiece = (pieceJustificationId: string) => {
    // Méthode principale : par piece_justification_id (recommandée)
    // Filtrer aussi par documentable_id pour s'assurer qu'on ne récupère que les documents du dossier actuel
    const filtered = documentsFromApi.filter(doc => 
      doc.piece_justification_id === pieceJustificationId &&
      (!doc.documentable_id || doc.documentable_id === id) // Filtrer par dossier
    );
    console.log(`🔍 getDocumentsByPiece pour piece_justification_id=${pieceJustificationId}, dossier=${id}:`, {
      totalDocuments: documentsFromApi.length,
      documentsAvecPieceId: documentsFromApi.filter(doc => doc.piece_justification_id === pieceJustificationId).length,
      documentsFiltres: filtered.length,
      documentableIds: filtered.map(d => d.documentable_id)
    });
    return filtered;
  };

  // Fonction pour obtenir les documents d'un type spécifique (fallback)
  // IMPORTANT: Filtrer uniquement les documents du dossier actuel (id)
  const getDocumentsByType = (typeDocumentId: string) => {
    return documentsFromApi.filter(doc => 
      doc.type_document_id === typeDocumentId &&
      (!doc.documentable_id || doc.documentable_id === id) // Filtrer par dossier
    );
  };

  // Fonction pour obtenir les documents d'une pièce (utilise piece_justification_id en priorité)
  // piece.type_document dans l'API = PieceJustificative.id
  // IMPORTANT: Filtrer uniquement les documents du dossier actuel (id)
  const getDocumentsForPiece = (piece: any) => {
    const pieceJustificationId = piece.type_document; // PieceJustificative.id selon LIAISON_PIECE_DOCUMENT.md
    
    // Méthode principale : par piece_justification_id
    const docsByPiece = getDocumentsByPiece(pieceJustificationId);
    if (docsByPiece.length > 0) {
      return docsByPiece;
    }
    
    // Fallback : par type_document_id (moins précis)
    // Note: Il faudrait récupérer le type_document_id depuis la pièce justificative via API
    // Pour l'instant, on utilise getDocumentsByType si disponible
    return getDocumentsByType(pieceJustificationId);
  };

  // Fonction pour vérifier si un document est validé pour une pièce
  const isDocumentValidatedForPiece = (piece: any) => {
    const docs = getDocumentsForPiece(piece);
    return docs.some(doc => doc.valide === true);
  };

  // Fonction pour vérifier si un document est validé (ancienne méthode, conservée pour compatibilité)
  const isDocumentValidated = (typeDocumentId: string) => {
    const docs = getDocumentsByType(typeDocumentId);
    return docs.some(doc => doc.valide === true);
  };

  // Réinitialiser les documents quand le dossier change
  // Cela garantit que chaque dossier a ses propres documents
  useEffect(() => {
    if (id) {
      console.log('🔄 Réinitialisation des documents pour le nouveau dossier:', id);
      setDocumentsFromApi([]); // Réinitialiser les documents avant de charger les nouveaux
    }
  }, [id]);

  // Charger les données au montage
  useEffect(() => {
    if (id) {
      chargerDossierComplet().then((dossierData) => {
        // Passer les données du dossier directement pour éviter les problèmes de synchronisation
        chargerDocuments();
        chargerCircuitEtTypesDocuments(dossierData);
        // Charger les épreuves seulement après que le dossier soit chargé
        chargerEpreuvesStatus();
      }).catch((error) => {
        console.error('❌ Erreur lors du chargement initial:', error);
      });
    }
  }, [id]);

  // Recharger le circuit si dossierComplet change et qu'on n'a pas encore de circuit
  // Cela sert de fallback si le chargement initial n'a pas fonctionné
  useEffect(() => {
    // Utiliser un timeout pour éviter les appels multiples rapides
    const timer = setTimeout(() => {
      if (dossierComplet && !circuit && !loadingCircuit && id) {
        console.log('🔄 Rechargement du circuit car dossierComplet a changé et aucun circuit n\'est chargé');
        chargerCircuit(dossierComplet);
      }
    }, 100); // Petit délai pour laisser le temps au chargement initial de se terminer

    return () => clearTimeout(timer);
  }, [dossierComplet?.id, id]); // Utiliser dossierComplet?.id pour éviter les re-renders inutiles

  return {
    loading,
    loadingDocuments,
    dossierComplet,
    dossier,
    epreuvesStatus,
    loadingEpreuves,
    circuit,
    loadingCircuit,
    typeDocuments,
    loadingTypeDocuments,
    documentsFromApi,
    setDocumentsFromApi,
    chargerDocuments,
    formatFileSize,
    getDocumentsByType,
    getDocumentsByPiece,
    getDocumentsForPiece,
    isDocumentValidated,
    isDocumentValidatedForPiece
  };
};

