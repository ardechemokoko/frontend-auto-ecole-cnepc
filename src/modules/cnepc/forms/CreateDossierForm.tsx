import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Collapse,
} from '@mui/material';
import {
  PersonAdd,
  School,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Add,
  Close,
} from '@mui/icons-material';
import {
  AutoEcole,
  Formation,
  Referentiel,
  autoEcoleService,
  typeDemandeService,
  referentielService,
  TypeDemande,
} from '../services';
import { authService } from '../../auth/services/authService';

interface CreateDossierFormProps {
  onSuccess: () => void;
}

const CreateDossierForm: React.FC<CreateDossierFormProps> = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // États pour les données
  const [autoEcoles, setAutoEcoles] = useState<AutoEcole[]>([]);
  const [loadingAutoEcoles, setLoadingAutoEcoles] = useState(false);
  const [selectedAutoEcole, setSelectedAutoEcole] = useState<AutoEcole | null>(null);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loadingFormations, setLoadingFormations] = useState(false);
  const [typeDemandes, setTypeDemandes] = useState<TypeDemande[]>([]);
  const [loadingTypeDemandes, setLoadingTypeDemandes] = useState(false);
  const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
  const [loadingReferentiels, setLoadingReferentiels] = useState(false);
  const [candidatId, setCandidatId] = useState<string | null>(null);
  const [personneId, setPersonneId] = useState<string | null>(null);
  
  // État pour le type de demande sélectionné
  const [selectedTypeDemande, setSelectedTypeDemande] = useState<TypeDemande | null>(null);
  const [typeDemandeId, setTypeDemandeId] = useState<string>('');
  const [isNouveauPermis, setIsNouveauPermis] = useState(false);

  // États du formulaire - Auto-école et formation (si nouveau permis)
  const [autoEcoleId, setAutoEcoleId] = useState<string>('');

  // États du formulaire - Informations personnelles
  const [personneData, setPersonneData] = useState({
    nom: '',
    prenom: '',
    email: '',
    contact: '',
    telephone: '',
    adresse: '',
    password: '',
    password_confirmation: '',
  });

  // États du formulaire - Informations du candidat
  const [candidatData, setCandidatData] = useState({
    date_naissance: '',
    lieu_naissance: '',
    nip: '',
    type_piece: 'CNI',
    numero_piece: '',
    nationalite: 'Sénégalaise',
    genre: 'M',
  });

  // États du formulaire - Formation et référentiel
  const [formationData, setFormationData] = useState({
    formation_id: '',
    referenciel_id: '',
    commentaires: '',
  });

  // Déterminer les étapes dynamiquement selon le type de demande
  const getSteps = () => {
    const baseSteps = ['Type de demande'];
    
    if (isNouveauPermis) {
      baseSteps.push('Auto-école et Formation');
    }
    
    baseSteps.push('Informations personnelles', 'Informations du candidat', 'Finalisation');
    
    return baseSteps;
  };

  const steps = getSteps();

  // Fonction pour détecter si c'est un nouveau permis
  const checkIsNouveauPermis = (typeDemandeName: string): boolean => {
    const nameLower = typeDemandeName.toLowerCase();
    return nameLower.includes('nouveau permis') || 
           nameLower.includes('nouveau') && nameLower.includes('permis') ||
           nameLower === 'nouveau permis';
  };

  // Charger les auto-écoles
  const loadAutoEcoles = async () => {
    setLoadingAutoEcoles(true);
    try {
      const response = await autoEcoleService.getAutoEcoles(1, 100);
      setAutoEcoles(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des auto-écoles:', err);
      setError('Impossible de charger les auto-écoles');
    } finally {
      setLoadingAutoEcoles(false);
    }
  };

  // Charger les formations de l'auto-école
  const loadFormations = async (autoEcoleId: string) => {
    setLoadingFormations(true);
    try {
      const data = await autoEcoleService.getFormationsByAutoEcole(autoEcoleId);
      setFormations(data.filter(f => f.statut));
    } catch (err: any) {
      console.error('Erreur lors du chargement des formations:', err);
      setError('Impossible de charger les formations');
    } finally {
      setLoadingFormations(false);
    }
  };

  // Charger les types de demande
  const loadTypeDemandes = async () => {
    setLoadingTypeDemandes(true);
    try {
      const response = await typeDemandeService.getTypeDemandes(1, 100);
      setTypeDemandes(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des types de demande:', err);
    } finally {
      setLoadingTypeDemandes(false);
    }
  };

  // Charger les référentiels (uniquement ceux de type "type_permis")
  const loadReferentiels = async () => {
    setLoadingReferentiels(true);
    try {
      const response = await referentielService.getReferentiels(1, 100);
      // Filtrer pour ne garder que les référentiels de type "type_permis"
      const referentielsTypePermis = (response.data || []).filter(
        (referentiel) => referentiel.type_ref === 'type_permis'
      );
      setReferentiels(referentielsTypePermis);
    } catch (err: any) {
      console.error('Erreur lors du chargement des référentiels:', err);
    } finally {
      setLoadingReferentiels(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (showForm) {
      loadTypeDemandes();
      loadReferentiels();
    }
  }, [showForm]);

  // Charger les auto-écoles si nouveau permis
  useEffect(() => {
    if (isNouveauPermis && showForm) {
      loadAutoEcoles();
    }
  }, [isNouveauPermis, showForm]);

  // Charger les formations quand une auto-école est sélectionnée
  useEffect(() => {
    if (autoEcoleId && isNouveauPermis && showForm) {
      const autoEcole = autoEcoles.find(ae => ae.id === autoEcoleId);
      if (autoEcole) {
        setSelectedAutoEcole(autoEcole);
        loadFormations(autoEcoleId);
      }
    }
  }, [autoEcoleId, autoEcoles, isNouveauPermis, showForm]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setActiveStep(0);
    setTypeDemandeId('');
    setSelectedTypeDemande(null);
    setIsNouveauPermis(false);
    setAutoEcoleId('');
    setSelectedAutoEcole(null);
    setCandidatId(null);
    setPersonneId(null);
    setPersonneData({
      nom: '',
      prenom: '',
      email: '',
      contact: '',
      telephone: '',
      adresse: '',
      password: '',
      password_confirmation: '',
    });
    setCandidatData({
      date_naissance: '',
      lieu_naissance: '',
      nip: '',
      type_piece: 'CNI',
      numero_piece: '',
      nationalite: 'Sénégalaise',
      genre: 'M',
    });
    setFormationData({
      formation_id: '',
      referenciel_id: '',
      commentaires: '',
    });
    setError(null);
    setSuccess(null);
  };

  // Validation de l'étape 0 : Type de demande
  const validateStep0 = () => {
    if (!typeDemandeId) {
      setError('Veuillez sélectionner un type de demande');
      return false;
    }
    return true;
  };

  // Validation de l'étape auto-école/formation (si nouveau permis)
  const validateStepAutoEcole = () => {
    if (!isNouveauPermis) return true; // Pas nécessaire si ce n'est pas nouveau permis
    
    if (!autoEcoleId) {
      setError('Veuillez sélectionner une auto-école');
      return false;
    }
    if (!formationData.formation_id) {
      setError('Veuillez sélectionner une formation');
      return false;
    }
    return true;
  };

  // Fonction utilitaire pour obtenir le libellé d'un champ
  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      nom: 'Nom',
      prenom: 'Prénom',
      email: 'Email',
      contact: 'Contact',
      telephone: 'Téléphone',
      adresse: 'Adresse',
      password: 'Mot de passe',
      password_confirmation: 'Confirmation du mot de passe',
      date_naissance: 'Date de naissance',
      lieu_naissance: 'Lieu de naissance',
      nip: 'NIP (Numéro d\'Identification Personnel)',
      type_piece: 'Type de pièce',
      numero_piece: 'Numéro de pièce',
      nationalite: 'Nationalité',
      genre: 'Genre',
      personne_id: 'Personne',
    };
    return labels[field.toLowerCase()] || field;
  };

  // Validation des informations personnelles
  // IMPORTANT : Selon INSCRIPTION_CANDIDAT_UPDATES.md, cette étape valide UNIQUEMENT :
  // - nom, prenom, email, contact (obligatoire), telephone (optionnel), adresse, password, password_confirmation
  // Les champs du candidat (date_naissance, lieu_naissance, nip, numero_piece) sont validés à l'étape suivante
  const validatePersonne = () => {
    const champsManquants: string[] = [];
    
    // Vérifier UNIQUEMENT les champs de la personne (selon la documentation)
    if (!personneData.nom || personneData.nom.trim() === '') {
      champsManquants.push('Nom');
    }
    if (!personneData.prenom || personneData.prenom.trim() === '') {
      champsManquants.push('Prénom');
    }
    if (!personneData.email || personneData.email.trim() === '') {
      champsManquants.push('Email');
    }
    if (!personneData.contact || personneData.contact.trim() === '') {
      champsManquants.push('Contact');
    }
    if (!personneData.password || personneData.password.trim() === '') {
      champsManquants.push('Mot de passe');
    }
    if (!personneData.password_confirmation || personneData.password_confirmation.trim() === '') {
      champsManquants.push('Confirmation du mot de passe');
    }
    
    // Afficher UNIQUEMENT les champs manquants de la personne
    if (champsManquants.length > 0) {
      setError(`Veuillez remplir les champs obligatoires suivants pour les informations personnelles : ${champsManquants.join(', ')}`);
      return false;
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personneData.email)) {
      setError('Veuillez entrer un email valide (exemple : nom@email.com)');
      return false;
    }
    
    // Validation du mot de passe
    if (personneData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    // Validation de la confirmation du mot de passe
    if (personneData.password !== personneData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.');
      return false;
    }
    
    return true;
  };

  // Validation des informations du candidat
  const validateCandidat = () => {
    const champsManquants: string[] = [];
    
    // Vérifier chaque champ individuellement
    if (!candidatData.date_naissance || candidatData.date_naissance.trim() === '') {
      champsManquants.push('Date de naissance');
    }
    if (!candidatData.lieu_naissance || candidatData.lieu_naissance.trim() === '') {
      champsManquants.push('Lieu de naissance');
    }
    if (!candidatData.nip || candidatData.nip.trim() === '') {
      champsManquants.push('NIP (Numéro d\'Identification Personnel)');
    }
    if (!candidatData.numero_piece || candidatData.numero_piece.trim() === '') {
      champsManquants.push('Numéro de pièce');
    }
    
    // Afficher les champs manquants
    if (champsManquants.length > 0) {
      setError(`Veuillez remplir les champs obligatoires suivants : ${champsManquants.join(', ')}`);
      return false;
    }
    
    return true;
  };

  // Calculer l'index réel de l'étape
  const getRealStepIndex = (step: number): number => {
    if (step === 0) return 0; // Type de demande
    if (step === 1 && isNouveauPermis) return 1; // Auto-école/Formation
    if (step === 1 && !isNouveauPermis) return 2; // Informations personnelles (saut auto-école)
    if (step === 2 && isNouveauPermis) return 2; // Informations personnelles
    if (step === 2 && !isNouveauPermis) return 3; // Informations candidat
    if (step === 3 && isNouveauPermis) return 3; // Informations candidat
    if (step === 4 && isNouveauPermis) return 4; // Finalisation
    if (step === 3 && !isNouveauPermis) return 4; // Finalisation
    return step;
  };

  // Passer à l'étape suivante
  const handleNext = async () => {
    setError(null);

    const realStep = getRealStepIndex(activeStep);

    if (realStep === 0) {
      // Étape 0 : Valider la sélection du type de demande
      if (!validateStep0()) return;
      
      const typeDemande = typeDemandes.find(td => td.id === typeDemandeId);
      if (typeDemande) {
        setSelectedTypeDemande(typeDemande);
        const isNouveau = checkIsNouveauPermis(typeDemande.name);
        setIsNouveauPermis(isNouveau);
        setActiveStep(1);
      }
    } else if (realStep === 1 && isNouveauPermis) {
      // Étape auto-école/formation (si nouveau permis)
      if (!validateStepAutoEcole()) return;
      setActiveStep(2);
    } else if (realStep === 2) {
      // Informations personnelles (realStep === 2 pour les deux cas : nouveau permis ou non)
      // IMPORTANT : Selon la documentation, cette étape ne valide QUE les champs de la personne
      // Les champs du candidat (date_naissance, lieu_naissance, nip, numero_piece) 
      // seront validés à l'étape suivante (Informations du candidat)
      console.log('🔍 [VALIDATION] Étape Informations personnelles - activeStep:', activeStep, 'realStep:', realStep, 'isNouveauPermis:', isNouveauPermis);
      if (!validatePersonne()) {
        console.log('❌ [VALIDATION] Échec validation informations personnelles');
        return;
      }
      console.log('✅ [VALIDATION] Validation informations personnelles réussie');
      
      setLoading(true);
      try {
        const registerResponse = await authService.register({
          email: personneData.email,
          password: personneData.password,
          password_confirmation: personneData.password_confirmation,
          nom: personneData.nom,
          prenom: personneData.prenom,
          contact: personneData.contact,
          telephone: personneData.telephone,
          adresse: personneData.adresse,
          role: 'candidat',
        });
        
        if (registerResponse.user.personne?.id) {
          setPersonneId(registerResponse.user.personne.id);
          setActiveStep(isNouveauPermis ? 3 : 2);
        } else {
          setError('Erreur: Impossible de récupérer l\'ID de la personne');
        }
      } catch (err: any) {
        // Selon la documentation INSCRIPTION_CANDIDAT_UPDATES.md :
        // Étape 1 (Informations personnelles) = POST /auth/register
        // Ne concerne QUE : nom, prenom, email, contact, telephone, adresse, password, password_confirmation, role
        // Les champs du candidat (date_naissance, lieu_naissance, nip, numero_piece) sont à l'ÉTAPE 2
        
        if (err.response?.data?.errors) {
          const champsPersonne = ['nom', 'prenom', 'email', 'contact', 'telephone', 'adresse', 'password', 'password_confirmation', 'role'];
          const champsCandidat = ['date_naissance', 'lieu_naissance', 'nip', 'type_piece', 'numero_piece', 'nationalite', 'genre', 'personne_id'];
          const erreursPersonne: string[] = [];
          
          Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const fieldLower = field.toLowerCase();
            
            // Ignorer COMPLÈTEMENT tous les champs du candidat (ils seront validés à l'étape suivante)
            if (champsCandidat.includes(fieldLower)) {
              // Ignorer silencieusement - ces champs ne sont pas pertinents à cette étape
              return;
            }
            
            // Ne garder QUE les erreurs des champs de la personne
            if (champsPersonne.includes(fieldLower)) {
              const messageList = Array.isArray(messages) ? messages : [messages];
              const fieldLabel = getFieldLabel(field);
              erreursPersonne.push(`${fieldLabel}: ${messageList.join(', ')}`);
            }
          });
          
          if (erreursPersonne.length > 0) {
            setError(`Erreur de validation pour les informations personnelles :\n• ${erreursPersonne.join('\n• ')}`);
          } else {
            // Si aucune erreur de personne, vérifier le message général
            const messageGeneral = err.response?.data?.message || '';
            
            // Si le message général mentionne des champs du candidat, ne pas l'afficher
            const mentionsChampsCandidat = champsCandidat.some(champ => 
              messageGeneral.toLowerCase().includes(champ.toLowerCase()) ||
              messageGeneral.includes('Date de naissance') ||
              messageGeneral.includes('Lieu de naissance') ||
              messageGeneral.includes('NIP') ||
              messageGeneral.includes('Numéro de pièce')
            );
            
            if (mentionsChampsCandidat) {
              // Le message mentionne des champs du candidat, ne pas l'afficher
              // Ces champs seront validés à l'étape suivante
              setError('Erreur lors de l\'enregistrement des informations personnelles. Veuillez vérifier que tous les champs sont correctement remplis.');
            } else {
              setError(messageGeneral || 'Erreur lors de l\'enregistrement des informations personnelles');
            }
          }
        } else {
          const messageGeneral = err.response?.data?.message || err.message || '';
          
          // Vérifier si le message général mentionne des champs du candidat
          const champsCandidat = ['date_naissance', 'lieu_naissance', 'nip', 'numero_piece'];
          const mentionsChampsCandidat = champsCandidat.some(champ => 
            messageGeneral.toLowerCase().includes(champ.toLowerCase()) ||
            messageGeneral.includes('Date de naissance') ||
            messageGeneral.includes('Lieu de naissance') ||
            messageGeneral.includes('NIP') ||
            messageGeneral.includes('Numéro de pièce')
          );
          
          if (mentionsChampsCandidat) {
            // Le message mentionne des champs du candidat, ne pas l'afficher tel quel
            setError('Erreur lors de l\'enregistrement des informations personnelles. Veuillez vérifier que tous les champs sont correctement remplis.');
          } else {
            setError(messageGeneral || 'Erreur lors de l\'enregistrement');
          }
        }
      } finally {
        setLoading(false);
      }
    } else if (realStep === 3) {
      // Informations du candidat (realStep === 3 pour les deux cas : nouveau permis ou non)
      console.log('🔍 [VALIDATION] Étape Informations du candidat - activeStep:', activeStep, 'realStep:', realStep, 'isNouveauPermis:', isNouveauPermis);
      if (!validateCandidat()) {
        console.log('❌ [VALIDATION] Échec validation informations candidat');
        return;
      }
      console.log('✅ [VALIDATION] Validation informations candidat réussie');
      
      setLoading(true);
      try {
        if (!personneId) {
          setError('Erreur: ID de la personne manquant. Veuillez recommencer.');
          setLoading(false);
          return;
        }
        
        const numero_candidat = `CAN-${Date.now()}`;
        const candidatPayload = {
          personne_id: personneId,
          numero_candidat,
          date_naissance: candidatData.date_naissance,
          lieu_naissance: candidatData.lieu_naissance,
          nip: candidatData.nip,
          type_piece: candidatData.type_piece,
          numero_piece: candidatData.numero_piece,
          nationalite: candidatData.nationalite,
          genre: candidatData.genre,
        };
        
        const response = await autoEcoleService.createCandidat(candidatPayload as any);
        setCandidatId(response.data.id);
        setActiveStep(isNouveauPermis ? 4 : 3);
      } catch (err: any) {
        if (err.response?.data?.errors) {
          // Filtrer uniquement les erreurs pertinentes pour l'étape "Informations du candidat"
          const champsCandidat = ['date_naissance', 'lieu_naissance', 'nip', 'type_piece', 'numero_piece', 'nationalite', 'genre', 'personne_id'];
          const erreursCandidat: string[] = [];
          
          Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
            // Ne garder que les erreurs des champs du candidat
            if (champsCandidat.includes(field.toLowerCase())) {
              const messageList = Array.isArray(messages) ? messages : [messages];
              const fieldLabel = getFieldLabel(field);
              erreursCandidat.push(`${fieldLabel}: ${messageList.join(', ')}`);
            }
          });
          
          if (erreursCandidat.length > 0) {
            setError(`Erreur de validation pour les informations du candidat :\n• ${erreursCandidat.join('\n• ')}`);
          } else {
            // Si aucune erreur de candidat, afficher le message général
            setError(err.response?.data?.message || 'Erreur lors de la création du candidat');
          }
        } else {
          setError(err.response?.data?.message || err.message || 'Erreur lors de la création du candidat');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Revenir à l'étape précédente
  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Soumettre le formulaire complet
  const handleSubmit = async () => {
    if (!candidatId) {
      setError('Erreur: Candidat non créé');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dossierPayload: any = {
        candidat_id: candidatId,
        type_demande_id: typeDemandeId,
        statut: 'en_attente',
        date_creation: today,
        commentaires: formationData.commentaires || undefined,
      };

      // Ajouter auto_ecole_id et formation_id seulement si nouveau permis
      if (isNouveauPermis) {
        if (!selectedAutoEcole || !formationData.formation_id) {
          setError('Auto-école et formation sont obligatoires pour un nouveau permis');
          setLoading(false);
          return;
        }
        dossierPayload.auto_ecole_id = selectedAutoEcole.id;
        dossierPayload.formation_id = formationData.formation_id;
      }

      // Ajouter referenciel_id si fourni
      if (formationData.referenciel_id) {
        dossierPayload.referenciel_id = formationData.referenciel_id;
      }
      
      const response = await autoEcoleService.createDossier(dossierPayload);

      setSuccess(response.message || 'Dossier créé avec succès !');
      
      setTimeout(() => {
        resetForm();
        setShowForm(false);
        onSuccess();
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        let errorDetails = '';
        Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
          const messageList = Array.isArray(messages) ? messages : [messages];
          errorDetails += `\n• ${field}: ${messageList.join(', ')}`;
        });
        setError(`Erreur de validation: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors de la création du dossier');
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtenir le contenu de l'étape actuelle
  const getStepContent = (step: number) => {
    const realStep = getRealStepIndex(step);

    switch (realStep) {
      case 0:
        return (
          <FormControl fullWidth required>
            <InputLabel>Type de demande</InputLabel>
            <Select
              value={typeDemandeId}
              onChange={(e) => setTypeDemandeId(e.target.value)}
              label="Type de demande"
              disabled={loadingTypeDemandes || loading}
            >
              {loadingTypeDemandes ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Chargement des types de demande...
                </MenuItem>
              ) : typeDemandes.length === 0 ? (
                <MenuItem disabled>
                  Aucun type de demande disponible
                </MenuItem>
              ) : (
                typeDemandes.map((typeDemande) => (
                  <MenuItem key={typeDemande.id} value={typeDemande.id}>
                    {typeDemande.name}
                  </MenuItem>
                ))
              )}
            </Select>
            {selectedTypeDemande && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {isNouveauPermis 
                  ? 'Ce type de demande nécessite la sélection d\'une auto-école et d\'une formation.'
                  : 'Ce type de demande ne nécessite pas d\'auto-école ni de formation.'}
              </Typography>
            )}
          </FormControl>
        );

      case 1:
        if (isNouveauPermis) {
          // Auto-école et Formation
          const selectedFormation = formations.find(f => f.id === formationData.formation_id);
          return (
            <Box>
              <FormControl fullWidth required sx={{ mb: 3 }}>
                <InputLabel>Auto-École</InputLabel>
                <Select
                  value={autoEcoleId}
                  onChange={(e) => setAutoEcoleId(e.target.value)}
                  label="Auto-École"
                  disabled={loadingAutoEcoles || loading}
                >
                  {loadingAutoEcoles ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Chargement des auto-écoles...
                    </MenuItem>
                  ) : autoEcoles.length === 0 ? (
                    <MenuItem disabled>
                      Aucune auto-école disponible
                    </MenuItem>
                  ) : (
                    autoEcoles.map((autoEcole) => (
                      <MenuItem key={autoEcole.id} value={autoEcole.id}>
                        {autoEcole.nom_auto_ecole}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{ mb: 3 }}>
                <InputLabel>Formation</InputLabel>
                <Select
                  value={formationData.formation_id}
                  onChange={(e) => setFormationData({ ...formationData, formation_id: e.target.value })}
                  label="Formation"
                  disabled={loadingFormations || loading || !autoEcoleId}
                >
                  {loadingFormations ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Chargement des formations...
                    </MenuItem>
                  ) : !autoEcoleId ? (
                    <MenuItem disabled>
                      Veuillez d'abord sélectionner une auto-école
                    </MenuItem>
                  ) : formations.length === 0 ? (
                    <MenuItem disabled>
                      Aucune formation active disponible
                    </MenuItem>
                  ) : (
                    formations.map((formation) => {
                      let typePermisLabel = 'N/A';
                      if (formation.typePermis) {
                        typePermisLabel = ('libelle' in formation.typePermis) 
                          ? formation.typePermis.libelle 
                          : ('nom' in formation.typePermis ? formation.typePermis.nom : 'N/A');
                      } else if (formation.type_permis) {
                        typePermisLabel = ('libelle' in formation.type_permis) 
                          ? formation.type_permis.libelle 
                          : ('nom' in formation.type_permis ? formation.type_permis.nom : 'N/A');
                      }
                      
                      return (
                        <MenuItem key={formation.id} value={formation.id}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <School fontSize="small" />
                              <Typography variant="body1" fontWeight="medium">
                                {formation.nom || `Formation ${typePermisLabel}`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={typePermisLabel} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={formation.montant_formate || `${formation.montant} FCFA`} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })
                  )}
                </Select>
              </FormControl>
            </Box>
          );
        }
        // Si pas nouveau permis, cette étape ne devrait pas être affichée
        return null;

      case 2:
        if (isNouveauPermis) {
          // Informations personnelles (après auto-école)
          return renderPersonneForm();
        } else {
          // Informations personnelles (directement après type de demande)
          return renderPersonneForm();
        }

      case 3:
        // Informations du candidat
        return renderCandidatForm();

      case 4:
        // Finalisation
        return (
          <Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Référentiel (optionnel)</InputLabel>
              <Select
                value={formationData.referenciel_id}
                onChange={(e) => setFormationData({ ...formationData, referenciel_id: e.target.value })}
                label="Référentiel (optionnel)"
                disabled={loadingReferentiels || loading}
              >
                <MenuItem value="">
                  <em>Aucun référentiel</em>
                </MenuItem>
                {loadingReferentiels ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Chargement des référentiels...
                  </MenuItem>
                ) : referentiels.length === 0 ? (
                  <MenuItem disabled>
                    Aucun référentiel disponible
                  </MenuItem>
                ) : (
                  referentiels.map((referentiel) => (
                    <MenuItem key={referentiel.id} value={referentiel.id}>
                      {referentiel.libelle} ({referentiel.code})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              label="Commentaires (optionnel)"
              value={formationData.commentaires}
              onChange={(e) => setFormationData({ ...formationData, commentaires: e.target.value })}
              multiline
              rows={3}
              fullWidth
              placeholder="Ajoutez des notes ou commentaires concernant ce dossier..."
              disabled={loading}
            />
          </Box>
        );

      default:
        return 'Étape inconnue';
    }
  };

  // Rendre le formulaire des informations personnelles
  const renderPersonneForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Informations d'identité
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Nom"
          value={personneData.nom}
          onChange={(e) => setPersonneData({ ...personneData, nom: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Prénom"
          value={personneData.prenom}
          onChange={(e) => setPersonneData({ ...personneData, prenom: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Coordonnées
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Email"
          type="email"
          value={personneData.email}
          onChange={(e) => setPersonneData({ ...personneData, email: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Contact"
          value={personneData.contact}
          onChange={(e) => setPersonneData({ ...personneData, contact: e.target.value })}
          fullWidth
          required
          disabled={loading}
          placeholder="Ex: 0612345678"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Téléphone"
          value={personneData.telephone}
          onChange={(e) => setPersonneData({ ...personneData, telephone: e.target.value })}
          fullWidth
          disabled={loading}
          placeholder="Ex: 0612345678"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Adresse"
          value={personneData.adresse}
          onChange={(e) => setPersonneData({ ...personneData, adresse: e.target.value })}
          fullWidth
          multiline
          rows={2}
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Sécurité
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Mot de passe"
          type="password"
          value={personneData.password}
          onChange={(e) => setPersonneData({ ...personneData, password: e.target.value })}
          fullWidth
          required
          disabled={loading}
          helperText="Minimum 8 caractères"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Confirmer le mot de passe"
          type="password"
          value={personneData.password_confirmation}
          onChange={(e) => setPersonneData({ ...personneData, password_confirmation: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
    </Grid>
  );

  // Rendre le formulaire des informations du candidat
  const renderCandidatForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Informations de naissance
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Date de naissance"
          type="date"
          value={candidatData.date_naissance}
          onChange={(e) => setCandidatData({ ...candidatData, date_naissance: e.target.value })}
          fullWidth
          required
          disabled={loading}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Lieu de naissance"
          value={candidatData.lieu_naissance}
          onChange={(e) => setCandidatData({ ...candidatData, lieu_naissance: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Identification
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="NIP (Numéro d'Identification Personnel)"
          value={candidatData.nip}
          onChange={(e) => setCandidatData({ ...candidatData, nip: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Type de pièce</InputLabel>
          <Select
            value={candidatData.type_piece}
            onChange={(e) => setCandidatData({ ...candidatData, type_piece: e.target.value })}
            label="Type de pièce"
            disabled={loading}
          >
            <MenuItem value="CNI">Carte Nationale d'Identité</MenuItem>
            <MenuItem value="Passeport">Passeport</MenuItem>
            <MenuItem value="Permis_conduire">Permis de conduire</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Numéro de pièce"
          value={candidatData.numero_piece}
          onChange={(e) => setCandidatData({ ...candidatData, numero_piece: e.target.value })}
          fullWidth
          required
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Nationalité"
          value={candidatData.nationalite}
          onChange={(e) => setCandidatData({ ...candidatData, nationalite: e.target.value })}
          fullWidth
          disabled={loading}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>Genre</InputLabel>
          <Select
            value={candidatData.genre}
            onChange={(e) => setCandidatData({ ...candidatData, genre: e.target.value })}
            label="Genre"
            disabled={loading}
          >
            <MenuItem value="M">Masculin</MenuItem>
            <MenuItem value="F">Féminin</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={showForm ? <Close /> : <Add />}
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Annuler' : 'Créer un nouveau dossier'}
        </Button>
      </Box>

      <Collapse in={showForm}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonAdd color="primary" />
            <Typography variant="h6">
              Créer un nouveau dossier
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Messages */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError(null)}
              icon={false}
            >
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
                <strong>Erreur de validation :</strong>
                <br />
                {error}
              </Typography>
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
              {success}
            </Alert>
          )}

          {/* Contenu de l'étape */}
          <Box sx={{ mb: 3 }}>
            {getStepContent(activeStep)}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  disabled={loading}
                  startIcon={<ArrowBack />}
                >
                  Précédent
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                >
                  {loading 
                    ? (getRealStepIndex(activeStep) === (isNouveauPermis ? 2 : 1) ? 'Enregistrement...' : getRealStepIndex(activeStep) === (isNouveauPermis ? 3 : 2) ? 'Création du candidat...' : 'Suivant')
                    : (activeStep === 0 ? 'Suivant' : getRealStepIndex(activeStep) === (isNouveauPermis ? 2 : 1) ? 'Créer le compte' : getRealStepIndex(activeStep) === (isNouveauPermis ? 3 : 2) ? 'Créer le candidat' : 'Suivant')
                  }
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading || loadingFormations || loadingTypeDemandes}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {loading ? 'Création en cours...' : 'Finaliser la création'}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default CreateDossierForm;
