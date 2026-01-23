import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Stack,
  Tooltip,
  LinearProgress,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Switch, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { CircuitSuivi, EtapeCircuit, PieceEtape } from '../services/circuit-suivi.service';
import { useDocumentPieceMapping } from '../hooks/useDocumentPieceMapping';
import axiosClient from '../../../shared/environment/envdev';

interface DocumentsCardProps {
  documentsFromApi: any[];
  loadingDocuments: boolean;
  uploading: boolean;
  dossierId?: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDocument: (document: any) => void;
  onDownloadDocument: (document: any) => void;
  onUpdateDocument?: (documentId: string, data: { valide: boolean; commentaires?: string }) => Promise<void>;
  formatFileSize: (bytes: number) => string;
  circuit?: CircuitSuivi | null;
  typeDocuments?: any[];
  pieceJustificationTypeMap?: Map<string, { libelle: string }>; // Map piece_justification_id -> { libelle }
}

const DocumentsCard: React.FC<DocumentsCardProps> = ({
  documentsFromApi,
  loadingDocuments,
  uploading,
  dossierId,
  fileInputRef,
  onUploadClick,
  onFileSelect,
  onViewDocument,
  onDownloadDocument,
  onUpdateDocument,
  formatFileSize,
  circuit,
  typeDocuments = [],
  pieceJustificationTypeMap = new Map()
}) => {
  const [validationDialog, setValidationDialog] = React.useState<{
    open: boolean;
    document: any | null;
    valide: boolean;
    commentaires: string;
  }>({
    open: false,
    document: null,
    valide: false,
    commentaires: ''
  });
  const [updatingDocument, setUpdatingDocument] = React.useState<string | null>(null);
  const [piecesJustificativesMap, setPiecesJustificativesMap] = React.useState<Map<string, any>>(new Map());
  
  // Le hook est toujours utilisé pour maintenir la compatibilité avec d'autres parties du code
  // mais on utilise directement localStorage dans getDocumentPieceId (comme RequiredDocumentsSection.tsx)
  useDocumentPieceMapping();

  // Filtrer les documents pour ne garder que ceux du dossier actuel
  // Le champ documentable_id correspond à l'ID du dossier
  const documentsForCurrentDossier = React.useMemo(() => {
    if (!dossierId) {
      // Si pas de dossierId, retourner tous les documents (compatibilité)
      return documentsFromApi;
    }
    
    // Filtrer par documentable_id pour s'assurer que seuls les documents du dossier actuel sont affichés
    const filtered = documentsFromApi.filter(doc => {
      // Si le document a un documentable_id, vérifier qu'il correspond au dossier actuel
      // Sinon, garder le document (pour compatibilité avec les anciens documents)
      const matches = !doc.documentable_id || doc.documentable_id === dossierId;
      
      if (!matches && doc.documentable_id) {
        console.log('🔍 Document filtré (appartient à un autre dossier):', {
          docId: doc.id,
          docNom: doc.nom || doc.nom_fichier,
          documentable_id: doc.documentable_id,
          currentDossierId: dossierId
        });
      }
      
      return matches;
    });
    
    console.log('📋 DocumentsCard - Documents filtrés pour le dossier:', {
      dossierId,
      totalDocuments: documentsFromApi.length,
      filteredDocuments: filtered.length,
      filteredOut: documentsFromApi.length - filtered.length,
      documents: filtered.map(doc => ({
        id: doc.id,
        nom: doc.nom || doc.nom_fichier,
        piece_justification_id: doc.piece_justification_id || 'N/A',
        type_document_id: doc.type_document_id || 'N/A',
        documentable_id: doc.documentable_id || 'N/A',
        valide: doc.valide || false,
        taille: doc.taille || 'N/A'
      }))
    });
    
    return filtered;
  }, [documentsFromApi, dossierId]);

  // Effect pour récupérer les pièces justificatives avec un seul GET
  React.useEffect(() => {
    const fetchPiecesJustificatives = async () => {
      // Extraire tous les piece_justification_id uniques des documents
      const pieceJustificationIds = new Set<string>();
      documentsForCurrentDossier.forEach(doc => {
        if (doc.piece_justification_id && doc.piece_justification_id !== 'N/A') {
          pieceJustificationIds.add(doc.piece_justification_id);
        }
      });

      if (pieceJustificationIds.size === 0) {
        console.log('📋 DocumentsCard - Aucun piece_justification_id trouvé dans les documents');
        setPiecesJustificativesMap(new Map());
        return;
      }

      console.log(`🔄 DocumentsCard - Récupération de ${pieceJustificationIds.size} pièce(s) justificative(s) unique(s)...`);
      console.log('📋 DocumentsCard - IDs des pièces justificatives à récupérer:', Array.from(pieceJustificationIds));

      try {
        // Faire un seul GET /pieces-justificatives
        console.log('📡 DocumentsCard - Appel API GET /pieces-justificatives');
        const response = await axiosClient.get('/pieces-justificatives');
        
        console.log('🔍 DocumentsCard - Réponse brute de GET /pieces-justificatives:', {
          status: response.status,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          isArray: Array.isArray(response.data),
          arrayLength: Array.isArray(response.data) ? response.data.length : null
        });
        
        // Extraire les données de la réponse (peut être dans response.data.data ou response.data)
        let allPieces: any[] = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            allPieces = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            allPieces = response.data.data;
          } else if (response.data.data && !Array.isArray(response.data.data)) {
            allPieces = [response.data.data];
          } else {
            allPieces = [response.data];
          }
        }
        
        console.log(`📊 DocumentsCard - ${allPieces.length} pièce(s) justificative(s) récupérée(s) au total`);

        // Filtrer pour ne garder que les pièces dont l'ID correspond aux piece_justification_id des documents
        const filteredPieces = allPieces.filter(piece => {
          const pieceId = piece.id;
          const matches = pieceJustificationIds.has(pieceId);
          
          if (matches) {
            console.log(`✅ DocumentsCard - Pièce justificative trouvée:`, {
              pieceId: piece.id,
              libelle: piece.libelle,
              type_document_id: piece.type_document_id
            });
          }
          
          return matches;
        });

        console.log(`✅ DocumentsCard - ${filteredPieces.length} pièce(s) justificative(s) filtrée(s) correspondant aux documents`);

        // Créer une Map pour un accès rapide : piece_justification_id -> données de la pièce
        const piecesMap = new Map<string, any>();
        filteredPieces.forEach(piece => {
          // Formater la réponse selon le format attendu
          const formattedPiece = {
            id: piece.id || null,
            type_document_id: piece.type_document_id || null,
            code: piece.code || null,
            libelle: piece.libelle || null,
            format_attendu: piece.format_attendu || null,
            obligatoire: piece.obligatoire ?? null,
            delivery_date: piece.delivery_date || null,
            expiration_date: piece.expiration_date || null,
            created_at: piece.created_at || null,
            updated_at: piece.updated_at || null,
            etape_id: piece.etape_id || null
          };
          
          piecesMap.set(piece.id, formattedPiece);
        });

        console.log('📊 DocumentsCard - Map des pièces justificatives créée:', {
          totalPieces: piecesMap.size,
          pieces: Array.from(piecesMap.entries()).map(([id, data]) => ({
            id,
            libelle: data.libelle,
            type_document_id: data.type_document_id
          }))
        });

        setPiecesJustificativesMap(piecesMap);
      } catch (error: any) {
        console.error('❌ DocumentsCard - Erreur lors de la récupération des pièces justificatives:', {
          error: error.response?.data || error.message,
          errorStatus: error.response?.status
        });
        setPiecesJustificativesMap(new Map());
      }
    };

    // Exécuter uniquement si on a des documents
    if (documentsForCurrentDossier.length > 0) {
      fetchPiecesJustificatives();
    } else {
      setPiecesJustificativesMap(new Map());
    }
  }, [documentsForCurrentDossier]);

  // Fonction pour ouvrir le dialogue de validation
  const handleOpenValidationDialog = (doc: any) => {
    setValidationDialog({
      open: true,
      document: doc,
      valide: doc.valide || false,
      commentaires: doc.commentaires || ''
    });
  };

  // Fonction pour fermer le dialogue
  const handleCloseValidationDialog = () => {
    setValidationDialog({
      open: false,
      document: null,
      valide: false,
      commentaires: ''
    });
  };

  // Fonction pour sauvegarder la validation
  const handleSaveValidation = async () => {
    if (!validationDialog.document || !onUpdateDocument) return;

    try {
      setUpdatingDocument(validationDialog.document.id);
      await onUpdateDocument(validationDialog.document.id, {
        valide: validationDialog.valide,
        commentaires: validationDialog.commentaires
      });
      handleCloseValidationDialog();
    } catch (error: any) {
      // Erreur silencieuse
    } finally {
      setUpdatingDocument(null);
    }
  };

  // Fonction utilitaire pour vérifier si une chaîne est un UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Fonction pour résoudre l'ID du type de document selon CORRELATION_DOCUMENTS_PIECES.md
  const getTypeDocumentId = React.useCallback((typeDocumentIdentifier: string): string | null => {
    if (!typeDocumentIdentifier) return null;

    // 1. Si c'est déjà un UUID, l'utiliser directement
    if (isUUID(typeDocumentIdentifier)) {
      return typeDocumentIdentifier;
    }

    // 2. Sinon, chercher par libellé, code ou name
    const typeDoc = typeDocuments.find(
      td => 
        td.id === typeDocumentIdentifier ||
        td.libelle?.toLowerCase() === typeDocumentIdentifier.toLowerCase() ||
        td.code?.toLowerCase() === typeDocumentIdentifier.toLowerCase() ||
        td.name?.toLowerCase() === typeDocumentIdentifier.toLowerCase()
    );
    
    return typeDoc?.id || null;
  }, [typeDocuments]);

  // Fonction pour trouver la pièce et l'étape correspondant à un document
  // MÊME LOGIQUE QUE RequiredDocumentsSection.tsx mais SANS localStorage
  // (car frontend-auto-ecole et frontend-candidat sont deux applications séparées)
  // On utilise uniquement les données de l'API : piece_justification_id et etape_id
  const findDocumentCorrelation = React.useCallback((doc: any): { etape: EtapeCircuit | null; piece: PieceEtape | null; typeDoc: any } => {
    if (!circuit) {
      return { etape: null, piece: null, typeDoc: null };
    }

    if (!circuit.etapes || circuit.etapes.length === 0) {
      return { etape: null, piece: null, typeDoc: null };
    }

    // Utiliser directement piece_justification_id de l'API (pas de localStorage car application séparée)
    const docPieceId = doc.piece_justification_id;
    // IMPORTANT: piece.type_document dans le circuit contient le type_document_id (référentiel),
    // pas l'ID de la PieceJustificative. On doit comparer pieceJustificative.type_document_id avec piece.type_document
    // Récupérer les données de la PieceJustificative depuis la map locale (piecesJustificativesMap)
    const pieceJustificativeData = docPieceId ? piecesJustificativesMap.get(docPieceId) : null;
    const docPieceJustificationLibelle = pieceJustificativeData?.libelle || null;

    // Collecter tous les piece.type_document du circuit pour comparaison et logs
    const allPieceTypeDocuments: Array<{etapeId: string; etapeLibelle: string; pieceLibelle: string; pieceTypeDocument: string}> = [];
    for (const etape of circuit.etapes || []) {
      if (etape.pieces) {
        for (const piece of etape.pieces) {
          allPieceTypeDocuments.push({
            etapeId: etape.id,
            etapeLibelle: etape.libelle,
            pieceLibelle: piece.libelle || 'N/A',
            pieceTypeDocument: piece.type_document
          });
        }
      }
    }

    // Parcourir toutes les étapes et leurs pièces
    // IMPORTANT: piece.type_document contient le type_document_id (référentiel),
    // pas l'ID de la PieceJustificative. On compare donc pieceJustificative.type_document_id avec piece.type_document
    for (const etape of circuit.etapes || []) {
      // Filtrer par etape_id si disponible (optimisation)
      if (doc.etape_id && doc.etape_id !== etape.id) {
        continue; // Le document appartient à une autre étape
      }
      
      if (etape.pieces) {
        for (const piece of etape.pieces) {
          const pieceTypeDocument = piece.type_document; // C'est le type_document_id (référentiel)
          
          // Récupérer le Referentiel correspondant à pieceTypeDocument pour obtenir son libelle
          const referentiel = typeDocuments.find(td => td.id === pieceTypeDocument);
          const referentielLibelle = referentiel?.libelle || referentiel?.name || null;
          
          // Comparaison UNIQUEMENT par libelle : PieceJustificative.libelle === Referentiel.libelle
          if (docPieceJustificationLibelle && referentielLibelle && 
              docPieceJustificationLibelle.toLowerCase().trim() === referentielLibelle.toLowerCase().trim()) {
            const docTypeDoc = typeDocuments.find(td => td.id === doc.type_document_id);
            const pieceTypeDoc = typeDocuments.find(td => td.id === pieceTypeDocument);
            
            return { etape, piece, typeDoc: pieceTypeDoc || docTypeDoc };
          }
        }
      }
    }

    // Aucune correspondance trouvée
    return { etape: null, piece: null, typeDoc: null };
  }, [circuit, typeDocuments, piecesJustificativesMap]);

  // Fonction pour obtenir le nom de la pièce à partir du piece_justification_id ou type_document_id
  const getPieceNameFromDocument = React.useCallback((doc: any): string | null => {
    // 1. Priorité : chercher par piece_justification_id dans piecesJustificativesMap
    if (doc.piece_justification_id) {
      const pieceJustificative = piecesJustificativesMap.get(doc.piece_justification_id);
      if (pieceJustificative?.libelle) {
        return pieceJustificative.libelle;
      }
      
      // Fallback : chercher dans les référentiels (typeDocuments)
      const pieceDoc = typeDocuments.find(td => td.id === doc.piece_justification_id);
      if (pieceDoc) {
        return pieceDoc.libelle || pieceDoc.name || pieceDoc.code || null;
      }
      
      // Si pas trouvé dans typeDocuments, chercher dans les pièces du circuit
      if (circuit) {
        for (const etape of circuit.etapes || []) {
          if (etape.pieces) {
            for (const piece of etape.pieces) {
              // piece.type_document devrait correspondre à piece_justification_id
              const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
              if ((pieceTypeDocumentId && String(pieceTypeDocumentId) === String(doc.piece_justification_id)) || 
                  String(piece.type_document) === String(doc.piece_justification_id)) {
                return piece.libelle || null;
              }
            }
          }
        }
      }
      
    }

    // 2. Fallback : chercher par type_document_id (si ce n'est pas "N/A")
    if (doc.type_document_id && doc.type_document_id !== 'N/A') {
      const typeDoc = typeDocuments.find(td => td.id === doc.type_document_id);
      if (typeDoc) {
        return typeDoc.libelle || typeDoc.name || typeDoc.code || null;
      }

      // Si pas trouvé, chercher dans les pièces du circuit
      if (circuit) {
        for (const etape of circuit.etapes || []) {
          if (etape.pieces) {
            for (const piece of etape.pieces) {
              const pieceTypeDocumentId = getTypeDocumentId(piece.type_document);
              if (pieceTypeDocumentId && String(pieceTypeDocumentId) === String(doc.type_document_id)) {
                return piece.libelle || null;
              }
            }
          }
        }
      }
    }

    return null;
  }, [typeDocuments, circuit, getTypeDocumentId, piecesJustificativesMap]);

  // Grouper les documents par étape (utiliser les documents filtrés)
  // IMPORTANT: Attendre que le circuit soit chargé avant de corréler les documents
  const documentsByEtape = React.useMemo(() => {
    const grouped = new Map<string, { etape: EtapeCircuit; documents: any[] }>();
    const uncorrelated: any[] = [];

    // Si le circuit n'est pas encore chargé, ne pas essayer de corréler
    // Cela évite les erreurs "Circuit absent pour document"
    if (!circuit || !circuit.etapes || circuit.etapes.length === 0) {
      console.log('⏳ DocumentsCard - Circuit non chargé, documents non corrélés pour l\'instant:', {
        circuitPresent: !!circuit,
        hasEtapes: (circuit?.etapes?.length || 0) > 0,
        totalDocuments: documentsForCurrentDossier.length
      });
      
      // Retourner tous les documents comme non corrélés pour l'instant
      documentsForCurrentDossier.forEach(doc => {
        const pieceName = getPieceNameFromDocument(doc);
        uncorrelated.push({ ...doc, pieceName });
      });
      
      return { grouped, uncorrelated };
    }

    console.log('📋 DocumentsCard - Groupement des documents par étape:', {
      totalDocuments: documentsForCurrentDossier.length,
      circuitId: circuit.id,
      circuitLibelle: circuit.libelle,
      etapesCount: circuit.etapes?.length || 0
    });

    documentsForCurrentDossier.forEach(doc => {
      console.log('🔍 DocumentsCard - Analyse du document:', {
        docId: doc.id,
        docNom: doc.nom || doc.nom_fichier,
        piece_justification_id: doc.piece_justification_id || 'N/A',
        type_document_id: doc.type_document_id || 'N/A',
        etape_id: doc.etape_id || 'N/A',
        documentable_id: doc.documentable_id || 'N/A',
        valide: doc.valide || false
      });
      
      const { etape, piece } = findDocumentCorrelation(doc);
      
      if (etape && piece) {
        console.log('✅ DocumentsCard - Document corrélé avec étape et pièce:', {
          docId: doc.id,
          docNom: doc.nom || doc.nom_fichier,
          etapeId: etape.id,
          etapeLibelle: etape.libelle,
          pieceLibelle: piece.libelle,
          pieceObligatoire: piece.obligatoire
        });
        
        const key = etape.id;
        if (!grouped.has(key)) {
          grouped.set(key, { etape, documents: [] });
        }
        grouped.get(key)!.documents.push({ ...doc, piece });
      } else {
        console.log('⚠️ DocumentsCard - Document non corrélé:', {
          docId: doc.id,
          docNom: doc.nom || doc.nom_fichier,
          piece_justification_id: doc.piece_justification_id || 'N/A',
          type_document_id: doc.type_document_id || 'N/A'
        });
        
        // Même pour les documents non corrélés, essayer de trouver le nom de la pièce
        // Utiliser piece_justification_id en priorité, puis type_document_id
        const pieceName = getPieceNameFromDocument(doc);
        uncorrelated.push({ ...doc, pieceName });
      }
    });

    console.log('📊 DocumentsCard - Résultat du groupement:', {
      etapesAvecDocuments: grouped.size,
      documentsCorreles: Array.from(grouped.values()).reduce((sum, { documents }) => sum + documents.length, 0),
      documentsNonCorreles: uncorrelated.length,
      details: {
        etapes: Array.from(grouped.entries()).map(([etapeId, { etape, documents }]) => ({
          etapeId,
          etapeLibelle: etape.libelle,
          documentsCount: documents.length,
          documents: documents.map(d => ({
            id: d.id,
            nom: d.nom || d.nom_fichier,
            piece_justification_id: d.piece_justification_id,
            valide: d.valide
          }))
        })),
        nonCorreles: uncorrelated.map(d => ({
          id: d.id,
          nom: d.nom || d.nom_fichier,
          piece_justification_id: d.piece_justification_id,
          pieceName: d.pieceName || 'N/A',
          valide: d.valide
        }))
      }
    });

    return { grouped, uncorrelated };
  }, [documentsForCurrentDossier, circuit, typeDocuments, getPieceNameFromDocument, findDocumentCorrelation]);
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
            <Typography variant="h6" fontWeight="bold" className="font-display">
              Documents ({documentsForCurrentDossier.length})
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudArrowUpIcon className="w-4 h-4" />}
            onClick={onUploadClick}
            disabled={uploading || !dossierId}
            className="font-primary"
          >
            {uploading ? 'Upload...' : 'Ajouter un document'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={onFileSelect}
          />
        </Box>

        {(loadingDocuments || uploading) && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" className="font-primary">
              {uploading ? 'Upload en cours...' : 'Chargement des documents...'}
            </Typography>
          </Box>
        )}

        {/* Documents existants groupés par étape */}
        {documentsForCurrentDossier.length > 0 ? (
          <Stack spacing={3}>
            {/* Documents corrélés avec les étapes */}
            {Array.from(documentsByEtape.grouped.entries()).map(([etapeId, { etape, documents }]) => (
              <Box key={etapeId}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" className="font-display" sx={{ mr: 1 }}>
                    {etape.libelle}
                  </Typography>
                  {etape.code && (
                    <Chip label={etape.code} size="small" variant="outlined" sx={{ mr: 1 }} />
                  )}
                  <Chip 
                    label={`${documents.length} document(s)`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
                <Stack spacing={1.5}>
                  {documents.map((doc: any) => {
                    const { piece, typeDoc } = findDocumentCorrelation(doc);
                    // Chercher le nom de la pièce : d'abord dans typeDoc, puis dans piece, puis via getPieceNameFromDocument
                    let pieceName = typeDoc?.libelle || typeDoc?.name || typeDoc?.code;
                    if (!pieceName && piece) {
                      pieceName = piece.libelle;
                    }
                    if (!pieceName) {
                      // Fallback : chercher dans les référentiels par piece_justification_id
                      pieceName = getPieceNameFromDocument(doc);
                    }
                    if (!pieceName) {
                      pieceName = 'Document';
                    }
                    
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: doc.valide ? 'success.main' : 'divider',
                          borderRadius: 1,
                          backgroundColor: doc.valide ? 'success.50' : 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" fontWeight="medium" className="font-primary">
                                {doc.nom || doc.nom_fichier}
                              </Typography>
                              {doc.valide && (
                                <Chip 
                                  label="Validé" 
                                  size="small" 
                                  color="success" 
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {piece?.obligatoire && (
                                <Chip 
                                  label="Obligatoire" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Chip 
                                label={pieceName || 'Pièce non identifiée'} 
                                size="small" 
                                color={pieceName ? 'primary' : 'default'}
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                              <Typography variant="caption" color="text.secondary" className="font-primary">
                                Pièce justificative
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" className="font-primary">
                              Taille: {doc.taille}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" className="font-primary">
                              Uploadé le {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                            <Tooltip title="Voir le document">
                              <IconButton
                                size="small"
                                onClick={() => onViewDocument(doc)}
                                color="primary"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Télécharger">
                              <IconButton
                                size="small"
                                onClick={() => onDownloadDocument(doc)}
                                color="secondary"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ))}

            {/* Documents non corrélés */}
            {documentsByEtape.uncorrelated.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" className="font-display" sx={{ mr: 1 }}>
                    Documents non corrélés
                  </Typography>
                  <Chip 
                    label={`${documentsByEtape.uncorrelated.length} document(s)`} 
                    size="small" 
                    color="default" 
                    variant="outlined" 
                  />
                </Box>
                <Stack spacing={1.5}>
                  {documentsByEtape.uncorrelated.map((doc: any) => {
                    const pieceName = doc.pieceName || getPieceNameFromDocument(doc);
                    
                    return (
                      <Box
                        key={doc.id}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          opacity: pieceName ? 1 : 0.7
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body1" fontWeight="medium" className="font-primary">
                                {doc.nom || doc.nom_fichier}
                              </Typography>
                              {doc.valide && (
                                <Chip 
                                  label="Validé" 
                                  size="small" 
                                  color="success" 
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            {pieceName ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip 
                                  label={pieceName} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                                <Typography variant="caption" color="text.secondary" className="font-primary">
                                  Pièce justificative
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="warning.main" className="font-primary" display="block" sx={{ mb: 0.5 }}>
                                ⚠️ Pièce non identifiée
                                {doc.type_document_id && ` (Type ID: ${doc.type_document_id.substring(0, 8)}...)`}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" className="font-primary">
                              Taille: {doc.taille}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" className="font-primary">
                              Uploadé le {doc.dateUpload ? new Date(doc.dateUpload).toLocaleDateString('fr-FR') : 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                            <Tooltip title="Voir le document">
                              <IconButton
                                size="small"
                                onClick={() => onViewDocument(doc)}
                                color="primary"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Télécharger">
                              <IconButton
                                size="small"
                                onClick={() => onDownloadDocument(doc)}
                                color="secondary"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </IconButton>
                            </Tooltip>
                            {onUpdateDocument && (
                              <Tooltip title={doc.valide ? "Document validé - Cliquer pour modifier" : "Valider le document"}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenValidationDialog(doc)}
                                  color={doc.valide ? "success" : "default"}
                                  disabled={updatingDocument === doc.id}
                                >
                                  {doc.valide ? (
                                    <CheckCircleIcon className="w-4 h-4" />
                                  ) : (
                                    <XCircleIcon className="w-4 h-4" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <Typography variant="h6" color="text.secondary" gutterBottom className="font-display">
              Aucun document disponible
            </Typography>
          </Box>
        )}

        {/* Dialogue de validation */}
        <Dialog
          open={validationDialog.open}
          onClose={handleCloseValidationDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {validationDialog.document && (
              <>Modifier le statut : {validationDialog.document.nom || validationDialog.document.nom_fichier}</>
            )}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1" className="font-primary">
                  Statut de validation
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color={validationDialog.valide ? 'success.main' : 'text.secondary'}>
                    {validationDialog.valide ? 'Validé' : 'Non validé'}
                  </Typography>
                  <Switch
                    checked={validationDialog.valide}
                    onChange={(e) => setValidationDialog(prev => ({ ...prev, valide: e.target.checked }))}
                    color="success"
                  />
                </Box>
              </Box>
              <TextField
                label="Commentaires"
                multiline
                rows={4}
                value={validationDialog.commentaires}
                onChange={(e) => setValidationDialog(prev => ({ ...prev, commentaires: e.target.value }))}
                placeholder="Ajouter des commentaires sur ce document..."
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseValidationDialog} color="inherit">
              Annuler
            </Button>
            <Button
              onClick={handleSaveValidation}
              variant="contained"
              color="primary"
              disabled={updatingDocument !== null}
            >
              {updatingDocument ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DocumentsCard;

