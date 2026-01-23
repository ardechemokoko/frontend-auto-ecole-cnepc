import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer le mapping persistant entre documents et pièces justificatives
 * Utilise localStorage pour persister le mapping même après rechargement
 * 
 * Ce hook écoute les événements documentUploaded et stocke un mapping persistant
 * pour gérer les cas où le backend retourne un piece_justification_id différent
 * de celui envoyé par le frontend.
 */
export const useDocumentPieceMapping = () => {
  // Fonction pour charger le mapping depuis localStorage
  const loadMappingFromStorage = useCallback(() => {
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
      console.warn('⚠️ Erreur lors du chargement du mapping depuis localStorage:', error);
    }
    return new Map<string, string>();
  }, []);

  // Fonction pour sauvegarder le mapping dans localStorage
  const saveMappingToStorage = useCallback((docId: string, pieceJustificationId: string, etapeId: string) => {
    try {
      const stored = localStorage.getItem('document_piece_mapping');
      const parsed = stored ? JSON.parse(stored) : {};
      
      parsed[docId] = {
        piece_justification_id: pieceJustificationId,
        etape_id: etapeId,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('document_piece_mapping', JSON.stringify(parsed));
      
      console.log('💾 Mapping sauvegardé dans localStorage:', {
        documentId: docId,
        pieceJustificationId: pieceJustificationId,
        etapeId: etapeId,
        totalMappings: Object.keys(parsed).length
      });
    } catch (error) {
      console.warn('⚠️ Erreur lors de la sauvegarde du mapping dans localStorage:', error);
    }
  }, []);

  // Charger le mapping au montage
  const [documentPieceMapping, setDocumentPieceMapping] = useState<Map<string, string>>(() => loadMappingFromStorage());

  useEffect(() => {
    const handleDocumentUploaded = (event: CustomEvent) => {
      const { document_id, piece_justification_id_original, etape_id } = event.detail || {};
      
      // Si le document a un mapping original, le stocker dans localStorage
      if (document_id && piece_justification_id_original) {
        saveMappingToStorage(document_id, piece_justification_id_original, etape_id || '');
        
        // Mettre à jour le mapping en mémoire
        setDocumentPieceMapping(prev => {
          const newMap = new Map(prev);
          newMap.set(document_id, piece_justification_id_original);
          return newMap;
        });
      }
    };
    
    window.addEventListener('documentUploaded', handleDocumentUploaded as EventListener);
    return () => {
      window.removeEventListener('documentUploaded', handleDocumentUploaded as EventListener);
    };
  }, [saveMappingToStorage]);

  /**
   * Trouve les documents correspondant à une pièce justificative
   * Utilise l'ordre de recherche recommandé :
   * 1. Recherche par piece_justification_id exact (déjà normalisé depuis localStorage)
   * 2. Recherche par mapping localStorage si piece_justification_id manquant
   * 3. Recherche par type_document_id (fallback pour documents uploadés avant l'implémentation du mapping)
   */
  const findDocumentsForPiece = (
    pieceJustificationId: string,
    documents: any[],
    useMapping: boolean = true,
    typeDocuments?: any[] // Ajouter typeDocuments pour le fallback par type_document_id
  ): any[] => {
    // Recharger le mapping depuis localStorage pour avoir la version la plus récente
    const currentMapping = loadMappingFromStorage();
    
    // Log de débogage pour comprendre le problème
    const documentsAvecPieceId = documents.filter(d => d.piece_justification_id);
    const documentsAvecPieceIdCorrespondant = documentsAvecPieceId.filter(d => 
      d.piece_justification_id === pieceJustificationId
    );
    
    if (documentsAvecPieceIdCorrespondant.length > 0) {
      console.log('🔍 findDocumentsForPiece - Documents avec piece_justification_id correspondant trouvés:', {
        pieceJustificationId,
        documentsTrouves: documentsAvecPieceIdCorrespondant.length,
        documents: documentsAvecPieceIdCorrespondant.map(d => ({
          id: d.id,
          nom: d.nom_fichier || d.nom,
          piece_justification_id: d.piece_justification_id
        }))
      });
    }
    
    // 1. Recherche par piece_justification_id exact (les documents sont déjà normalisés)
    let docs = documents.filter(doc => {
      // Utiliser le piece_justification_id du document (déjà normalisé)
      // Comparaison stricte (===) pour éviter les problèmes de type
      if (doc.piece_justification_id && String(doc.piece_justification_id) === String(pieceJustificationId)) {
        return true;
      }
      
      // Si le document n'a pas de piece_justification_id, essayer le mapping localStorage
      if (useMapping && doc.id) {
        const mappedPieceId = currentMapping.get(doc.id);
        if (mappedPieceId && String(mappedPieceId) === String(pieceJustificationId)) {
          return true;
        }
      }
      
      return false;
    });

    // 2. Si pas trouvé, essayer aussi avec le mapping en mémoire (pour les nouveaux uploads)
    if (docs.length === 0 && useMapping) {
      docs = documents.filter(doc => {
        const mappedPieceId = documentPieceMapping.get(doc.id);
        return mappedPieceId && String(mappedPieceId) === String(pieceJustificationId);
      });
    }

    // 3. Fallback : Si toujours pas trouvé, essayer de matcher par type_document_id
    // IMPORTANT: Ce fallback ne doit être utilisé QUE pour les documents qui n'ont
    // absolument aucun piece_justification_id (ni dans le document, ni dans le mapping)
    // pour éviter d'associer des documents à toutes les pièces
    if (docs.length === 0) {
      docs = documents.filter(doc => {
        // Vérifier que le document n'a PAS de piece_justification_id dans le document normalisé
        if (doc.piece_justification_id) {
          return false;
        }
        
        // Vérifier aussi qu'il n'y a pas de mapping localStorage pour ce document
        // (car cela signifierait qu'il est déjà associé à une autre pièce)
        if (useMapping && doc.id) {
          const mappedPieceId = currentMapping.get(doc.id);
          if (mappedPieceId) {
            // Le document a un mapping, donc il est déjà associé à une pièce
            // Ne pas l'utiliser dans le fallback
            return false;
          }
        }
        
        // Seulement si le document n'a vraiment aucun piece_justification_id,
        // on peut essayer le fallback par type_document_id
        // Note: pieceJustificationId peut être soit un PieceJustificative.id soit un TypeDocument.id
        // selon la structure des données
        if (doc.type_document_id === pieceJustificationId) {
          return true;
        }
        
        return false;
      });
      
      if (docs.length > 0) {
        console.log('🔧 findDocumentsForPiece - Documents trouvés via fallback type_document_id (cas rare - documents sans piece_justification_id):', {
          pieceJustificationId,
          documentsTrouves: docs.length,
          documents: docs.map(d => ({ 
            id: d.id, 
            nom: d.nom_fichier || d.nom, 
            type_document_id: d.type_document_id,
            piece_justification_id: d.piece_justification_id,
            hasMapping: useMapping && d.id ? currentMapping.has(d.id) : false
          }))
        });
      }
    }

    return docs;
  };

  /**
   * Vérifie si un document correspond à une pièce justificative
   */
  const isDocumentForPiece = (
    doc: any,
    pieceJustificationId: string,
    useMapping: boolean = true
  ): boolean => {
    // 1. Vérification par piece_justification_id exact (déjà normalisé)
    if (doc.piece_justification_id === pieceJustificationId) {
      return true;
    }

    // 2. Vérification par mapping localStorage
    if (useMapping && doc.id) {
      const currentMapping = loadMappingFromStorage();
      const mappedPieceId = currentMapping.get(doc.id);
      if (mappedPieceId === pieceJustificationId) {
        return true;
      }
      
      // Essayer aussi avec le mapping en mémoire
      const memoryMappedPieceId = documentPieceMapping.get(doc.id);
      if (memoryMappedPieceId === pieceJustificationId) {
        return true;
      }
    }

    return false;
  };

  return {
    documentPieceMapping,
    findDocumentsForPiece,
    isDocumentForPiece,
    loadMappingFromStorage,
    saveMappingToStorage
  };
};

