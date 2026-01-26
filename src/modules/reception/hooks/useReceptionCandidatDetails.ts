import React, { useState, useEffect } from 'react';
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
  // Map pour corréler piece_justification_id -> { type_document_id, libelle }
  const [pieceJustificationTypeMap, setPieceJustificationTypeMap] = useState<Map<string, { libelle: string }>>(new Map());
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
      
      // Utiliser directement l'endpoint /dossiers/{id}
      let dossierData: any = null;
      
      try {
        const response = await axiosClient.get(`/dossiers/${id}`);
        dossierData = response.data?.data || response.data;
      } catch (error: any) {
        // Si 404, essayer de récupérer depuis la liste /dossiers comme fallback
        if (error?.response?.status === 404) {
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
          } catch (listError: any) {
            throw new Error('Dossier non trouvé ou non accessible');
          }
        } else {
          throw error;
        }
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
        
        setDocumentsFromApi(mappedFromDossier);
      }
      
      // Retourner les données du dossier pour les utiliser dans le chargement du circuit
      return dossierData;
    } catch (error: any) {
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
          hasMore = false;
        }
      }

      setTypeDocuments(allTypes);
    } catch (err: any) {
      // Erreur silencieuse
    } finally {
      setLoadingTypeDocuments(false);
    }
  };

  // Fonction pour charger le circuit
  const chargerCircuit = async (dossierData?: any) => {
    try {
      setLoadingCircuit(true);

      // Utiliser les données passées en paramètre ou celles de l'état
      const dossierDataToUse = dossierData || dossierComplet;
      const dossierToUse = dossier;

      let circuitData: CircuitSuivi | null = null;

      // Méthode 1: Utiliser le circuit déjà présent dans le dossier
      if (dossierDataToUse?.circuit) {
        circuitData = dossierDataToUse.circuit;
      }
      // Méthode 2: Utiliser type_demande_id si disponible
      else if (dossierDataToUse?.type_demande_id) {
        const typeDemande = await typeDemandeService.getTypeDemandeById(dossierDataToUse.type_demande_id);
        
        if (typeDemande?.name) {
          const nomEntite = typeDemande.name;
          circuitData = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
        }
      }
      // Méthode 3: Utiliser type_demande.name directement si disponible
      else if (dossierDataToUse?.type_demande?.name) {
        const nomEntite = dossierDataToUse.type_demande.name;
        circuitData = await circuitSuiviService.getCircuitByNomEntite(nomEntite);
      }
      // Méthode 4: Utiliser le dossier de base si disponible
      else if (dossierToUse?.details?.dossier_complet) {
        const dossierBase = dossierToUse.details.dossier_complet;
        if (dossierBase.circuit) {
          circuitData = dossierBase.circuit;
        } else if (dossierBase.type_demande_id) {
          try {
            const typeDemande = await typeDemandeService.getTypeDemandeById(dossierBase.type_demande_id);
            if (typeDemande?.name) {
              circuitData = await circuitSuiviService.getCircuitByNomEntite(typeDemande.name);
            }
          } catch (err) {
            // Erreur silencieuse
          }
        }
      }
      // Méthode 5: Fallback - utiliser le circuit unique si un seul existe
      if (!circuitData) {
        try {
          const circuits = await circuitSuiviService.getCircuits();
          const circuitsActifs = circuits.filter(c => c.actif);
          if (circuitsActifs.length === 1) {
            circuitData = circuitsActifs[0];
          }
        } catch (err) {
          // Erreur silencieuse
        }
      }
      
      if (circuitData) {
        // Si le circuit n'a pas d'étapes, les charger séparément selon CIRCUIT_SUIVI_SERVICE.md
        if (circuitData.id && (!circuitData.etapes || circuitData.etapes.length === 0)) {
          try {
            const etapes = await circuitSuiviService.getEtapesByCircuitId(circuitData.id);
            if (etapes.length > 0) {
              circuitData.etapes = etapes;
            }
          } catch (err: any) {
            // Erreur silencieuse
          }
        }
        
        setCircuit(circuitData);
      }
    } catch (err: any) {
      // Erreur silencieuse
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

  // Fonction helper pour charger le mapping depuis localStorage
  const loadPieceJustificationMapping = React.useCallback(() => {
    try {
      const stored = localStorage.getItem('document_piece_mapping');
      if (stored) {
        const parsed = JSON.parse(stored);
        const mapping = new Map<string, string>();
        Object.entries(parsed).forEach(([docId, data]: [string, any]) => {
          if (data && data.piece_justification_id) {
            mapping.set(docId, data.piece_justification_id);
          }
        });
        return mapping;
      }
    } catch (error) {
      // Erreur silencieuse
    }
    return new Map<string, string>();
  }, []);

  // Fonction pour charger les documents depuis l'API et localStorage (documents simulés)
  const chargerDocuments = async () => {
    if (!id) return;

    try {
      setLoadingDocuments(true);
      
      // Charger le mapping depuis localStorage au début de chaque chargement de documents
      const pieceJustificationMapping = loadPieceJustificationMapping();
      
      // Charger les documents simulés depuis localStorage
      let simulatedDocuments: any[] = [];
      try {
        const storedDocs = localStorage.getItem('simulated_documents');
        if (storedDocs) {
          const parsedDocs = JSON.parse(storedDocs);
          // Filtrer les documents simulés pour ce dossier
          simulatedDocuments = Object.values(parsedDocs).filter((doc: any) => 
            doc.documentable_id === id
          ) as any[];
          console.log('📦 Documents simulés chargés depuis localStorage:', simulatedDocuments.length);
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors du chargement des documents simulés:', error);
      }
      
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

      // Fusionner les documents de l'API avec les documents simulés
      const allDocuments = [...documents, ...simulatedDocuments];
      
      if (allDocuments.length > 0) {
        const mappedDocuments = allDocuments.map((doc: any) => {
          // IMPORTANT: Le mapping est la source de vérité car c'est ce qui a été envoyé lors de l'upload
          // L'API peut retourner un mauvais piece_justification_id, donc on priorise le mapping
          const apiPieceId = doc.piece_justification_id || null;
          const mappedPieceId = doc.id ? pieceJustificationMapping.get(doc.id) : null;
          // PRIORISER le mapping (source de vérité) au lieu de l'API
          const restoredPieceJustificationId = mappedPieceId || apiPieceId || null;
          
          // Vérifier si c'est un document simulé
          const isSimulated = doc.id && doc.id.startsWith('sim_');
          
          return {
            id: doc.id,
            nom: doc.nom_fichier || doc.nom,
            nom_fichier: doc.nom_fichier || doc.nom,
            chemin_fichier: isSimulated ? 'simulated' : doc.chemin_fichier,
            url: isSimulated ? null : doc.chemin_fichier, // Les documents simulés n'ont pas d'URL
            taille: doc.taille_fichier_formate || formatFileSize(doc.taille_fichier || 0),
            taille_fichier: doc.taille_fichier,
            type_mime: doc.type_mime,
            type: doc.type_mime,
            valide: doc.valide !== undefined ? doc.valide : false,
            valide_libelle: doc.valide_libelle || (doc.valide ? 'Validé' : 'Non validé'),
            dateUpload: doc.created_at || doc.date_upload,
            created_at: doc.created_at,
            commentaires: doc.commentaires,
            type_document_id: doc.type_document_id,
            piece_justification_id: restoredPieceJustificationId,
            documentable_id: doc.documentable_id || id,
            documentable_type: doc.documentable_type || 'App\\Models\\Dossier',
            etape_id: doc.etape_id || null,
            is_simulated: isSimulated // Flag pour identifier les documents simulés
          };
        });

        // Remplacer les documents existants par les nouveaux (mise à jour complète)
        // Cela évite les doublons et garantit que les données sont à jour
        setDocumentsFromApi(mappedDocuments);
        
        // Charger les PieceJustificative pour créer la map piece_justification_id -> type_document_id
        await chargerPieceJustifications(mappedDocuments);
      } else if (simulatedDocuments.length > 0) {
        // Si seulement des documents simulés, les traiter quand même
        const mappedSimulated = simulatedDocuments.map((doc: any) => ({
          id: doc.id,
          nom: doc.nom_fichier || doc.nom,
          nom_fichier: doc.nom_fichier || doc.nom,
          chemin_fichier: 'simulated',
          url: null,
          taille: doc.taille_fichier_formate || formatFileSize(doc.taille_fichier || 0),
          taille_fichier: doc.taille_fichier,
          type_mime: doc.type_mime,
          type: doc.type_mime,
          valide: doc.valide !== undefined ? doc.valide : true,
          valide_libelle: doc.valide_libelle || 'Validé',
          dateUpload: doc.created_at,
          created_at: doc.created_at,
          commentaires: doc.commentaires,
          type_document_id: doc.type_document_id,
          piece_justification_id: doc.piece_justification_id,
          documentable_id: doc.documentable_id || id,
          documentable_type: doc.documentable_type || 'App\\Models\\Dossier',
          etape_id: doc.etape_id || null,
          is_simulated: true
        }));
        setDocumentsFromApi(mappedSimulated);
        await chargerPieceJustifications(mappedSimulated);
      }
    } catch (error: any) {
      // Erreur silencieuse
      // Ne pas écraser les documents existants en cas d'erreur
      // setDocumentsFromApi([]); // Commenté pour préserver les documents existants
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Fonction pour charger les PieceJustificative et créer la map piece_justification_id -> { type_document_id, libelle }
  // Cette map permet de comparer les libelles : PieceJustificative.libelle avec Referentiel.libelle
  const chargerPieceJustifications = async (documents: any[]) => {
    try {
      // Collecter tous les piece_justification_id uniques
      const pieceJustificationIds = new Set<string>();
      documents.forEach(doc => {
        if (doc.piece_justification_id) {
          pieceJustificationIds.add(doc.piece_justification_id);
        }
      });

      if (pieceJustificationIds.size === 0) {
        setPieceJustificationTypeMap(new Map());
        return;
      }

      // Charger toutes les PieceJustificative en parallèle
      const piecePromises = Array.from(pieceJustificationIds).map(async (pieceId) => {
        try {
          const response = await axiosClient.get(`/pieces-justificatives/${pieceId}`);
          let piece = null;
          
          // Gérer différentes structures de réponse
          if (response.data) {
            if (response.data.data) {
              piece = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
            } else if (Array.isArray(response.data)) {
              piece = response.data.length > 0 ? response.data[0] : null;
            } else {
              piece = response.data;
            }
          }
          
          if (!piece || !piece.libelle) {
            return null;
          }
          
          return { 
            pieceId, 
            libelle: piece.libelle
          };
        } catch (error: any) {
          return null;
        }
      });

      const results = await Promise.all(piecePromises);
      
      // Créer la map piece_justification_id -> { libelle }
      const newMap = new Map<string, { libelle: string }>();
      results.forEach(result => {
        if (result && result.libelle) {
          newMap.set(result.pieceId, {
            libelle: result.libelle
          });
        }
      });

      setPieceJustificationTypeMap(newMap);
    } catch (error: any) {
      // Erreur silencieuse
      setPieceJustificationTypeMap(new Map());
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
      }).catch(() => {
        // Erreur silencieuse
      });
    }
  }, [id]);

  // Recharger le circuit si dossierComplet change et qu'on n'a pas encore de circuit
  // Cela sert de fallback si le chargement initial n'a pas fonctionné
  useEffect(() => {
    // Utiliser un timeout pour éviter les appels multiples rapides
    const timer = setTimeout(() => {
      if (dossierComplet && !circuit && !loadingCircuit && id) {
        chargerCircuit(dossierComplet);
      }
    }, 100); // Petit délai pour laisser le temps au chargement initial de se terminer

    return () => clearTimeout(timer);
  }, [dossierComplet?.id, id]); // Utiliser dossierComplet?.id pour éviter les re-renders inutiles

  // Écouter les événements de document uploadé pour recharger les documents
  useEffect(() => {
    const handleDocumentUploaded = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Vérifier que l'événement concerne ce dossier
      if (detail.documentable_id && detail.documentable_id !== id) {
        return;
      }
      
      if (id) {
        // Attendre un peu pour laisser le temps au backend de sauvegarder
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recharger les documents avec le mapping localStorage
        await chargerDocuments();
      }
    };

    const handleCircuitReload = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Vérifier que l'événement concerne ce dossier
      if (detail.dossierId && detail.dossierId !== id) {
        return;
      }
      
      if (id && dossierComplet) {
        console.log('🔄 Rechargement du circuit après mise à jour du statut');
        // IMPORTANT: Vider le cache du circuit pour forcer le rechargement avec les nouveaux statuts
        circuitSuiviService.clearCache();
        console.log('🗑️ Cache du circuit vidé pour forcer le rechargement');
        // Attendre un peu pour laisser le temps au backend de mettre à jour le statut
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Recharger le circuit et les documents
        await chargerCircuitEtTypesDocuments(dossierComplet);
        await chargerDocuments();
        console.log('✅ Circuit et documents rechargés après mise à jour du statut');
      }
    };

    window.addEventListener('documentUploaded', handleDocumentUploaded as EventListener);
    window.addEventListener('circuitReload', handleCircuitReload as EventListener);
    return () => {
      window.removeEventListener('documentUploaded', handleDocumentUploaded as EventListener);
      window.removeEventListener('circuitReload', handleCircuitReload as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dossierComplet]); // chargerDocuments utilise loadPieceJustificationMapping en interne

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
    isDocumentValidatedForPiece,
    pieceJustificationTypeMap // Map piece_justification_id -> type_document_id
  };
};

