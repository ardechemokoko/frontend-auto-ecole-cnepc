import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Card,
  CardContent,
  Button,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
// Heroicons imports
import { 
  XMarkIcon, 
  UserIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  EyeIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { ReceptionDossier } from '../types';
import axiosClient from '../../../shared/environment/envdev';
import { autoEcoleService } from '../../cnepc/services/auto-ecole.service';

interface CandidatDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  dossier: ReceptionDossier | null;
}

const CandidatDetailsSheet: React.FC<CandidatDetailsSheetProps> = ({
  open,
  onClose,
  dossier
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsFromApi, setDocumentsFromApi] = useState<any[]>([]);
  const [dossierComplet, setDossierComplet] = useState<any>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Charger les données complètes du dossier quand le sheet s'ouvre
  useEffect(() => {
    if (open && dossier && dossier.reference) {
      chargerDossierComplet().then(() => {
        // Charger les documents après que le dossier complet soit chargé
        chargerDocuments();
      });
    }
  }, [open, dossier]);

  // Recharger les documents si dossierComplet change et qu'il contient des documents
  useEffect(() => {
    if (dossierComplet && open && dossier && dossierComplet.documents && Array.isArray(dossierComplet.documents) && dossierComplet.documents.length > 0) {
      // Si les documents n'ont pas encore été chargés, utiliser ceux du dossier complet
      if (documentsFromApi.length === 0) {
        console.log('🔄 Utilisation des documents depuis dossierComplet (useEffect)...', dossierComplet.documents.length);
        
        const mappedFromDossier = dossierComplet.documents.map((doc: any) => ({
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
          commentaires: doc.commentaires
        }));
        
        setDocumentsFromApi(mappedFromDossier);
        console.log('✅ Documents récupérés depuis dossierComplet (useEffect):', mappedFromDossier.length);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierComplet, open]);

  // Fonction pour charger le dossier complet depuis l'API
  const chargerDossierComplet = async () => {
    if (!dossier?.reference) return;

    try {
      setLoading(true);
      console.log('📋 Chargement du dossier complet:', dossier.reference);
      
      // Récupérer le dossier complet via l'API
      const dossierData = await autoEcoleService.getDossierById(dossier.reference);
      setDossierComplet(dossierData);
      
      console.log('✅ Dossier complet chargé:', dossierData);
      console.log('📄 Documents dans le dossier complet:', dossierData?.documents?.length || 0);
      
      // Si le dossier contient des documents, les utiliser immédiatement
      if (dossierData?.documents && Array.isArray(dossierData.documents) && dossierData.documents.length > 0) {
        console.log('🔄 Documents trouvés dans dossierComplet, utilisation directe...');
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
          commentaires: doc.commentaires
        }));
        setDocumentsFromApi(mappedFromDossier);
        console.log('✅ Documents chargés depuis dossierComplet:', mappedFromDossier.length);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement du dossier complet:', error);
      // Utiliser les données disponibles dans dossier.details si disponible
      if (dossier.details?.dossier) {
        console.log('🔄 Utilisation des données depuis dossier.details.dossier...');
        setDossierComplet(dossier.details.dossier);
        
        // Essayer aussi de récupérer les documents depuis dossier.details.dossier
        if (dossier.details.dossier.documents && Array.isArray(dossier.details.dossier.documents) && dossier.details.dossier.documents.length > 0) {
          const mappedFromDetails = dossier.details.dossier.documents.map((doc: any) => ({
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
            commentaires: doc.commentaires
          }));
          setDocumentsFromApi(mappedFromDetails);
          console.log('✅ Documents chargés depuis dossier.details.dossier:', mappedFromDetails.length);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les documents depuis l'API (même méthode que EleveDetailsSheet.tsx)
  const chargerDocuments = async () => {
    if (!dossier?.reference) {
      console.warn('⚠️ Aucune référence de dossier disponible pour charger les documents');
      return;
    }

    try {
      setLoadingDocuments(true);
      console.log('📄 Chargement des documents pour le dossier:', dossier.reference);
      
      // Utiliser l'endpoint GET /documents?dossier_id={dossierId} (même que EleveDetailsSheet.tsx)
      const response = await axiosClient.get('/documents', {
        params: {
          dossier_id: dossier.reference
        }
      });

      console.log('📦 Réponse API documents:', response.data);
      console.log('📋 Structure de la réponse:', {
        success: response.data.success,
        hasData: !!response.data.data,
        isArray: Array.isArray(response.data.data),
        dataType: typeof response.data.data,
        dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A'
      });

      // Vérifier différentes structures de réponse possibles
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
      }

      console.log(`📊 ${documents.length} document(s) trouvé(s) dans la réponse`);

      if (documents.length > 0) {
        // Mapper les documents pour correspondre au format attendu (même que EleveDetailsSheet.tsx)
        const mappedDocuments = documents.map((doc: any) => {
          const mapped = {
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
            commentaires: doc.commentaires
          };
          
          console.log('📄 Document mappé:', mapped.nom);
          return mapped;
        });

        setDocumentsFromApi(mappedDocuments);
        console.log('✅ Documents chargés depuis l\'API:', mappedDocuments.length);
      } else {
        console.warn('⚠️ Aucun document trouvé dans la réponse');
        // Essayer de récupérer les documents depuis dossierComplet si disponibles
        if (dossierComplet?.documents && Array.isArray(dossierComplet.documents) && dossierComplet.documents.length > 0) {
          console.log('🔄 Tentative de récupération des documents depuis dossierComplet...');
          const mappedFromDossier = dossierComplet.documents.map((doc: any) => ({
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
            commentaires: doc.commentaires
          }));
          setDocumentsFromApi(mappedFromDossier);
          console.log('✅ Documents récupérés depuis dossierComplet:', mappedFromDossier.length);
        } else {
          setDocumentsFromApi([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des documents:', error);
      console.error('📋 Détails de l\'erreur:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        params: error?.config?.params
      });
      
      // Fallback: essayer de récupérer les documents depuis dossierComplet ou dossier.details
      try {
        const documentsFromDossier = dossierComplet?.documents || dossier.details?.dossier?.documents;
        if (documentsFromDossier && Array.isArray(documentsFromDossier) && documentsFromDossier.length > 0) {
          console.log('🔄 Utilisation des documents depuis dossier/dossierComplet comme fallback...');
          const mappedFromDossier = documentsFromDossier.map((doc: any) => ({
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
            commentaires: doc.commentaires
          }));
          setDocumentsFromApi(mappedFromDossier);
          console.log('✅ Documents récupérés depuis fallback:', mappedFromDossier.length);
        } else {
          setDocumentsFromApi([]);
        }
      } catch (fallbackError) {
        console.error('❌ Erreur lors du fallback:', fallbackError);
        setDocumentsFromApi([]);
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (!dossier) return null;

  // Utiliser les données complètes si disponibles, sinon utiliser les données du dossier
  const candidatData = dossierComplet?.candidat || dossier.details?.candidat_complet || dossier.details?.dossier?.candidat;
  const personne = candidatData?.personne || {};
  const formation = dossierComplet?.formation || dossier.details?.formation_complete || dossier.details?.dossier?.formation;
  const autoEcole = dossierComplet?.auto_ecole || dossier.details?.auto_ecole_complete || {};

  const handleViewDocument = async (document: any) => {
    try {
      if (!document.id) {
        alert(`Impossible d'ouvrir le document: ${document.nom || document.nom_fichier}\n\nLe document n'a pas d'ID valide.`);
        return;
      }

      console.log('📄 Ouverture du document PDF:', {
        nom: document.nom || document.nom_fichier,
        id: document.id,
        chemin_fichier: document.chemin_fichier,
        type_mime: document.type_mime
      });

      // Essayer différentes méthodes pour récupérer le fichier PDF
      const endpoints = [
        { url: `/documents/${document.id}`, headers: { 'Accept': 'application/pdf,application/octet-stream,*/*' } },
        { url: `/documents/${document.id}/download`, headers: {} },
        { url: `/documents/${document.id}/file`, headers: {} },
        ...(document.chemin_fichier ? [{ url: `/storage/${document.chemin_fichier}`, headers: {} }] : []),
        ...(document.chemin_fichier ? [{ url: `/files/${document.chemin_fichier}`, headers: {} }] : [])
      ];

      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Tentative avec: ${endpoint.url}`);
          
          const response = await axiosClient.get(endpoint.url, {
            responseType: 'blob',
            headers: endpoint.headers
          });

          const contentType = response.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            console.log('⚠️ Réponse JSON reçue au lieu du fichier, essai de la méthode suivante');
            continue;
          }

          if (response.data instanceof Blob && response.data.size > 0) {
            const blob = new Blob([response.data], {
              type: response.headers['content-type'] || document.type_mime || 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            
            window.open(url, '_blank');
            
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            
            console.log('✅ Document ouvert avec succès');
            return;
          }
        } catch (error: any) {
          console.log(`❌ Erreur avec ${endpoint.url}:`, error?.response?.status || error?.message);
          lastError = error;
          continue;
        }
      }

      throw lastError || new Error('Toutes les méthodes de récupération du fichier ont échoué');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture du document:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'ouverture du document';
      alert(`Erreur lors de l'ouverture du document: ${document.nom || document.nom_fichier}\n\n${errorMessage}`);
    }
  };

  const handleDownloadDocument = async (document: any) => {
    try {
      if (document.id) {
        console.log('📥 Téléchargement du document via API avec authentification:', {
          nom: document.nom || document.nom_fichier,
          id: document.id,
          chemin_fichier: document.chemin_fichier
        });

        let documentUrl = '';
        
        if (document.chemin_fichier) {
          documentUrl = `/storage/${document.chemin_fichier}`;
        } else {
          documentUrl = `/documents/${document.id}/download`;
        }

        try {
          const response = await axiosClient.get(documentUrl, {
            responseType: 'blob',
          });

          const blob = new Blob([response.data], {
            type: response.headers['content-type'] || document.type_mime || 'application/pdf'
          });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = document.nom || document.nom_fichier || 'document';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error: any) {
          if (error?.response?.status === 404 && document.chemin_fichier) {
            const altUrl = `/documents/${document.id}/download`;
            const altResponse = await axiosClient.get(altUrl, {
              responseType: 'blob',
            });
            const blob = new Blob([altResponse.data], {
              type: altResponse.headers['content-type'] || document.type_mime || 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = document.nom || document.nom_fichier || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } else {
            throw error;
          }
        }
      } else {
        alert(`Impossible de télécharger le document: ${document.nom || document.nom_fichier}\n\nLe document n'a pas d'ID valide.`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement du document:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors du téléchargement du document';
      alert(`Erreur lors du téléchargement du document: ${document.nom || document.nom_fichier}\n\n${errorMessage}`);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400, md: 500 },
          maxWidth: '100vw',
          boxShadow: 'none',
          borderLeft: '1px solid',
          borderColor: 'divider',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" className="font-display">
            Détails du candidat
          </Typography>
          <IconButton onClick={onClose} size="small">
            <XMarkIcon className="w-5 h-5" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Contenu principal */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <LinearProgress sx={{ width: '100%' }} />
              <Typography variant="body2" sx={{ ml: 2 }}>Chargement des données...</Typography>
            </Box>
          ) : (
            <>
              {/* Informations de base */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                    <Typography variant="h6" fontWeight="bold" className="font-display">
                      {personne.prenom || dossier.candidatPrenom} {personne.nom || dossier.candidatNom}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <Typography variant="body2" className="font-primary">{personne.email || ''}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PhoneIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <Typography variant="body2" className="font-primary">{personne.contact || ''}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <MapPinIcon className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                      <Typography variant="body2" className="font-primary">{personne.adresse || ''}</Typography>
                    </Box>
                    
                    {candidatData?.date_naissance && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                        <Typography variant="body2" className="font-primary">
                          Né(e) le {new Date(candidatData.date_naissance).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    )}
                    
                    {candidatData?.lieu_naissance && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MapPinIcon className="w-5 h-5 mr-2 text-gray-500" />
                        <Typography variant="body2" className="font-primary">
                          Lieu de naissance: {candidatData.lieu_naissance}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-500" />
                      <Typography variant="body2" className="font-primary">
                        Nationalité: {candidatData?.nationalite || 'Non spécifiée'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Informations de l'auto-école */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-600" />
                    <Typography variant="h6" fontWeight="bold" className="font-display">
                      Auto-École
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                        Nom de l'auto-école
                      </Typography>
                      <Typography variant="body1" className="font-primary">
                        {autoEcole.nom_auto_ecole || autoEcole.nom || dossier.autoEcoleNom}
                      </Typography>
                    </Box>
                    
                    {formation && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                          Formation
                        </Typography>
                        <Typography variant="body1" className="font-primary">
                          {formation.type_permis?.libelle || formation.nom || 'Formation'}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                        Date d'envoi
                      </Typography>
                      <Typography variant="body1" className="font-primary">
                        {new Date(dossier.dateEnvoi).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                    
                    {dossier.dateExamen && (
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                          Date d'examen
                        </Typography>
                        <Typography variant="body1" className="font-primary">
                          {new Date(dossier.dateExamen).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom className="font-primary">
                        Référence du dossier
                      </Typography>
                      <Typography variant="body1" className="font-primary">
                        {dossier.reference}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                    <Typography variant="h6" fontWeight="bold" className="font-display">
                      Documents ({documentsFromApi.length})
                    </Typography>
                  </Box>

                  {(loadingDocuments) && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary" className="font-primary">
                        Chargement des documents...
                      </Typography>
                    </Box>
                  )}

                  {/* Documents existants */}
                  {documentsFromApi.length > 0 ? (
                    <Stack spacing={2}>
                      {documentsFromApi.map((doc: any) => (
                        <Box
                          key={doc.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'background.paper'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight="medium" gutterBottom className="font-primary">
                                {doc.nom}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" className="font-primary">
                                Taille: {doc.taille}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" className="font-primary">
                                Uploadé le {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                              <Tooltip title="Voir le document">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDocument(doc)}
                                  color="primary"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Télécharger">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadDocument(doc)}
                                  color="secondary"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <Typography variant="h6" color="text.secondary" gutterBottom className="font-display">
                        Aucun document disponible
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose} className="font-primary">
              Fermer
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CandidatDetailsSheet;

