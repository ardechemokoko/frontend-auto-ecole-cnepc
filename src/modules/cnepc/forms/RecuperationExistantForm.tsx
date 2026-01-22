import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  Stepper,
  Step,
  StepLabel,
  Collapse,
} from '@mui/material';
import {
  PersonAdd,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Add,
  Close,
} from '@mui/icons-material';
import {
  AutoEcole,
  autoEcoleService,
  TypeDemande,
} from '../services';
import { gestionDossierService } from '../services/gestion-dossier.service';
import { 
  NumeroPermisParts, 
  PermisData, 
  PersonneData, 
  CandidatData, 
  FormationData,
} from './types';
import { 
  checkIsFicheEnregistre,
  getFieldLabel,
  buildNumeroPermis,
} from './utils';
import {
  validateStepNumeroPermis,
  validateStepPermis,
  ValidationContext,
  validatePersonne,
  validateCandidat,
} from './validation';
import { authService } from '../../auth/services/authService';
import { useTypeDemandes, useReferentiels } from './hooks';
import {
  NumeroPermisStep,
  PermisInfoStep,
  PersonneFormStep,
  CandidatFormStep,
  FinalisationStep,
  DossierInfoStep,
} from './steps';

interface RecuperationExistantFormProps {
  onSuccess: () => void;
}

const RecuperationExistantForm: React.FC<RecuperationExistantFormProps> = ({ onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  const [candidatId, setCandidatId] = useState<string | null>(null);
  const [personneId, setPersonneId] = useState<string | null>(null);
  
  // État pour le type de demande (toujours DUPLICATA)
  const [typeDemandeId, setTypeDemandeId] = useState<string>('');
  const [selectedTypeDemande, setSelectedTypeDemande] = useState<TypeDemande | null>(null);
  const [isFicheEnregistre, setIsFicheEnregistre] = useState(false);
  
  // État pour le numéro de permis
  const [numeroPermis, setNumeroPermis] = useState<string>('');
  
  // État pour le format de numéro de permis
  const [permisFormat, setPermisFormat] = useState<'standard' | 'op'>('standard');
  const [permisOrigineFormat, setPermisOrigineFormat] = useState<'standard' | 'op'>('standard');
  
  const [numeroPermisParts, setNumeroPermisParts] = useState<NumeroPermisParts>({
    annee: '',
    province: '',
    categorie: '',
    numero: '',
  });

  // États pour la construction du numéro de permis d'origine
  const [numeroOriginePermisParts, setNumeroOriginePermisParts] = useState<NumeroPermisParts>({
    annee: '',
    province: '',
    categorie: '',
    numero: '',
  });

  // États pour les informations du permis
  const [permisData, setPermisData] = useState<PermisData>({
    numero_permis: '',
    numero_origine_permis: '',
    lieu_de_dobtention_du_permis: '',
    date_de_dobtention_du_permis: '',
    date_de_delivrance_du_permis: '',
  });

  // États pour le captcha (non utilisés dans la récupération mais requis par PersonneFormStep)
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('');

  // États du formulaire - Informations personnelles (récupérées depuis l'API)
  const [personneData, setPersonneData] = useState<PersonneData>({
    nom: '',
    prenom: '',
    email: '',
    contact: '',
    telephone: '',
    adresse: '',
    password: '',
    password_confirmation: '',
  });

  // États du formulaire - Informations du candidat (récupérées depuis l'API)
  const [candidatData, setCandidatData] = useState<CandidatData>({
    date_naissance: '',
    lieu_naissance: '',
    nip: '',
    type_piece: 'CNI',
    numero_piece: '',
    nationalite: 'Sénégalaise',
    genre: 'M',
  });

  // États du formulaire - Formation et référentiel
  const [formationData, setFormationData] = useState<FormationData>({
    formation_id: '',
    referenciel_id: '',
    commentaires: '',
  });

  // États pour les données récupérées
  const [dataRecuperee, setDataRecuperee] = useState<any>(null);
  const [loadingRecuperation, setLoadingRecuperation] = useState(false);
  const [categoriePermisRecuperee, setCategoriePermisRecuperee] = useState<string | null>(null);

  const { typeDemandes, loading: loadingTypeDemandes, loadTypeDemandes } = useTypeDemandes();
  const { referentiels, loading: loadingReferentiels, loadReferentiels } = useReferentiels();

  // Étapes pour la récupération de l'existant
  const steps = [
    'Type de demande',
    'Numéro de permis',
    'Récupération des données',
    'Informations du permis',
    'Informations personnelles',
    'Informations du candidat',
    'Finalisation'
  ];

  // Charger les types de demande au montage
  useEffect(() => {
    if (showForm) {
      loadTypeDemandes();
      loadReferentiels();
    }
  }, [showForm]);

  // Trouver et sélectionner automatiquement DUPLICATA
  useEffect(() => {
    if (typeDemandes.length > 0 && !typeDemandeId) {
      const duplicataType = typeDemandes.find(td => 
        td.name.toLowerCase().includes('duplicata') || 
        td.name.toLowerCase().includes('duplicate')
      );
      if (duplicataType) {
        setTypeDemandeId(duplicataType.id);
        setSelectedTypeDemande(duplicataType);
        const isFiche = checkIsFicheEnregistre(duplicataType.name);
        setIsFicheEnregistre(isFiche);
      }
    }
  }, [typeDemandes, typeDemandeId]);

  // Réinitialiser les données récupérées si le numéro de permis change
  useEffect(() => {
    // Construire le numéro de permis actuel à partir des valeurs de l'étape (toujours utiliser numeroPermisParts)
    const numPermisActuel = buildNumeroPermis(numeroPermisParts, permisFormat);
    if (numPermisActuel && dataRecuperee) {
      const numPermisDansData = (dataRecuperee.numero_permis || dataRecuperee.numeroPermis || '').replace(/-/g, '').toUpperCase();
      const numPermisActuelSansTirets = numPermisActuel.replace(/-/g, '').toUpperCase();
      
      // Si le numéro de permis ne correspond pas aux données récupérées, réinitialiser
      if (numPermisDansData && numPermisDansData !== numPermisActuelSansTirets) {
        console.log('🔄 Numéro de permis changé, réinitialisation des données récupérées');
        console.log('   • Numéro actuel (depuis numeroPermisParts):', numPermisActuel);
        console.log('   • Numéro dans les données récupérées:', numPermisDansData);
        setDataRecuperee(null);
        setCategoriePermisRecuperee(null);
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
        setPermisData({
          numero_permis: '',
          numero_origine_permis: '',
          lieu_de_dobtention_du_permis: '',
          date_de_dobtention_du_permis: '',
          date_de_delivrance_du_permis: '',
        });
        setFormationData(prev => ({
          ...prev,
          referenciel_id: '',
        }));
      }
    }
  }, [numeroPermisParts, permisFormat, dataRecuperee]);

  // Mapper le referenciel_id une fois que les référentiels sont chargés et qu'on a une catégorie
  useEffect(() => {
    if (categoriePermisRecuperee && referentiels.length > 0 && !formationData.referenciel_id) {
      const referentielTrouve = referentiels.find(
        (ref) => ref.code && ref.code.toUpperCase() === categoriePermisRecuperee.toUpperCase()
      );
      
      if (referentielTrouve) {
        setFormationData(prev => ({
          ...prev,
          referenciel_id: referentielTrouve.id,
        }));
        console.log('✅ Référentiel mappé après chargement:', {
          id: referentielTrouve.id,
          code: referentielTrouve.code,
          libelle: referentielTrouve.libelle,
          categorie: categoriePermisRecuperee
        });
      }
    }
  }, [categoriePermisRecuperee, referentiels, formationData.referenciel_id]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setActiveStep(0);
    setTypeDemandeId('');
    setSelectedTypeDemande(null);
    setIsFicheEnregistre(false);
    setNumeroPermis('');
    setPermisFormat('standard');
    setPermisOrigineFormat('standard');
    setNumeroPermisParts({
      annee: '',
      province: '',
      categorie: '',
      numero: '',
    });
    setNumeroOriginePermisParts({
      annee: '',
      province: '',
      categorie: '',
      numero: '',
    });
    setPermisData({
      numero_permis: '',
      numero_origine_permis: '',
      lieu_de_dobtention_du_permis: '',
      date_de_dobtention_du_permis: '',
      date_de_delivrance_du_permis: '',
    });
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
    setDataRecuperee(null);
    setCategoriePermisRecuperee(null);
    setCaptchaId('');
    setCaptchaCode('');
    setError(null);
    setSuccess(null);
  };

  // Calculer l'index réel de l'étape
  const getRealStepIndex = (step: number): number => {
    return step; // Pour récupération, les étapes sont linéaires
  };

  // Récupérer les données depuis l'API
  const recupererDonnees = async () => {
    // TOUJOURS construire le numéro de permis à partir des valeurs actuelles de l'étape
    // Ne pas utiliser numeroPermis qui pourrait contenir une valeur obsolète
    const numPermisComplet = buildNumeroPermis(numeroPermisParts, permisFormat);
    
    if (!numPermisComplet) {
      setError('Le numéro de permis est requis. Veuillez remplir tous les champs du numéro de permis.');
      return false;
    }
    
    console.log('🔍 Construction du numéro de permis depuis l\'étape actuelle:');
    console.log('   • numeroPermisParts:', numeroPermisParts);
    console.log('   • permisFormat:', permisFormat);
    console.log('   • numPermisComplet construit:', numPermisComplet);

    // Réinitialiser TOUTES les données avant de faire une nouvelle récupération
    // pour éviter d'utiliser des données stockées précédemment
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
    setPermisData({
      numero_permis: '',
      numero_origine_permis: '',
      lieu_de_dobtention_du_permis: '',
      date_de_dobtention_du_permis: '',
      date_de_delivrance_du_permis: '',
    });
    setFormationData(prev => ({
      ...prev,
      referenciel_id: '',
    }));
    setCategoriePermisRecuperee(null);
    setDataRecuperee(null);
    setPersonneId(null);
    setCandidatId(null);

    setLoadingRecuperation(true);
    setError(null);

    try {
      console.log('🔍 Récupération des données depuis l\'API pour le numéro de permis:', numPermisComplet);
      console.log('📋 Numéro de permis formaté (sans tirets):', numPermisComplet.replace(/-/g, ''));
      
      // Appel API uniquement - pas de cache, pas de données stockées
      const response = await gestionDossierService.getChangePermis(numPermisComplet);
      console.log('✅ Réponse API reçue (objet):', response);
      console.log('✅ Réponse API (JSON):', JSON.stringify(response, null, 2));
      
      // Vérifier que la réponse contient des données
      if (!response) {
        setError('Aucune réponse reçue de l\'API pour ce numéro de permis.');
        return false;
      }
      
      // La réponse peut être dans response.data ou directement dans response
      // La réponse peut être un tableau ou un objet
      let rawData = response.data || response;
      
      // Vérifier que rawData existe et n'est pas vide
      if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
        setError('Aucune donnée trouvée dans la réponse de l\'API pour ce numéro de permis.');
        return false;
      }
      
      // Normaliser le numéro de permis recherché pour la comparaison
      const numPermisRecherche = numPermisComplet.replace(/-/g, '').toUpperCase();
      console.log('🔍 Numéro de permis recherché (normalisé):', numPermisRecherche);
      
      // Si c'est un tableau, trouver l'élément qui correspond EXACTEMENT au numéro de permis
      let data: any;
      if (Array.isArray(rawData)) {
        console.log('📋 La réponse est un tableau avec', rawData.length, 'élément(s)');
        
        // Chercher l'élément qui correspond exactement au numéro de permis recherché
        const elementCorrespondant = rawData.find((item: any) => {
          const itemNumPermis = (item.numero_permis || item.numeroPermis || '').replace(/-/g, '').toUpperCase();
          const correspond = itemNumPermis === numPermisRecherche;
          console.log(`  • Comparaison: "${itemNumPermis}" === "${numPermisRecherche}" ? ${correspond}`);
          return correspond;
        });
        
        if (elementCorrespondant) {
          data = elementCorrespondant;
          console.log('✅ Élément correspondant exactement trouvé dans le tableau');
        } else {
          // Aucun match exact trouvé - ne pas remplir les données
          console.error('❌ Aucun élément ne correspond exactement au numéro de permis recherché');
          console.error('   Numéro recherché:', numPermisRecherche);
          console.error('   Numéros trouvés dans l\'API:', rawData.map((item: any) => 
            (item.numero_permis || item.numeroPermis || '').replace(/-/g, '').toUpperCase()
          ));
          setError(`Aucune correspondance exacte trouvée pour le numéro de permis "${numPermisComplet}". Les numéros trouvés dans l'API ne correspondent pas.`);
          return false;
        }
        setDataRecuperee(rawData); // Stocker tout le tableau pour référence
      } else {
        // Pour un objet unique, vérifier que le numéro de permis correspond exactement
        const numPermisDansData = (rawData.numero_permis || rawData.numeroPermis || '').replace(/-/g, '').toUpperCase();
        
        if (numPermisDansData && numPermisDansData !== numPermisRecherche) {
          console.error('❌ Le numéro de permis dans les données ne correspond pas au numéro recherché');
          console.error('   Recherché:', numPermisRecherche);
          console.error('   Trouvé:', numPermisDansData);
          setError(`Le numéro de permis dans la réponse de l'API ("${rawData.numero_permis || rawData.numeroPermis}") ne correspond pas au numéro recherché ("${numPermisComplet}").`);
          return false;
        }
        
        // Vérifier que l'objet contient au moins quelques données essentielles
        if (!rawData.numero_permis && !rawData.nom && !rawData.prenom) {
          setError('La réponse de l\'API ne contient pas de données valides pour ce numéro de permis.');
          return false;
        }
        
        data = rawData;
        setDataRecuperee(data);
        console.log('✅ Données uniques correspondantes trouvées');
      }

      console.log('🔍 Structure complète des données reçues depuis l\'API:', data);
      console.log('🔍 Clés disponibles dans data:', Object.keys(data));
      
      // Vérification finale : s'assurer que le numéro de permis correspond toujours
      const numPermisDansDataFinal = (data.numero_permis || data.numeroPermis || '').replace(/-/g, '').toUpperCase();
      if (numPermisDansDataFinal !== numPermisRecherche) {
        console.error('❌ Erreur de validation : le numéro de permis ne correspond toujours pas');
        setError(`Erreur de validation : le numéro de permis dans les données ("${data.numero_permis || data.numeroPermis}") ne correspond pas au numéro recherché ("${numPermisComplet}").`);
        return false;
      }
      
      console.log('✅ Validation réussie : le numéro de permis correspond exactement');

      // La structure de la réponse API est différente :
      // - Les champs sont directement dans l'objet (nom, prenom, date_naissance, etc.)
      // - Pas de sous-objets "personne" ou "candidat"
      
      // Remplir les données de la personne UNIQUEMENT depuis l'API
      const hasPersonneData = data.nom || data.prenom;

      if (hasPersonneData) {
        const newPersonneData = {
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          contact: data.contact || data.numero_identite || '',
          telephone: data.telephone || data.contact || '',
          adresse: data.adresse || '',
          password: '',
          password_confirmation: '',
        };
        
        console.log('✅ Données personne mappées:', newPersonneData);
        setPersonneData(newPersonneData);
        
        // Si on a un ID dans la réponse, on peut le stocker
        if (data.id) {
          // Note: L'ID dans la réponse semble être l'ID du permis, pas de la personne
          // On ne définit pas personneId ici car il n'est pas dans la réponse
        }
      }

      // Remplir les données du candidat
      const hasCandidatData = data.date_naissance || data.numero_identite || data.lieu_naissance;

      if (hasCandidatData) {
        const newCandidatData = {
          date_naissance: data.date_naissance || '',
          lieu_naissance: data.lieu_naissance || '',
          nip: data.nip || data.numero_identite || '',
          type_piece: data.type_piece || 'CNI',
          numero_piece: data.numero_piece || data.numero_identite || '',
          nationalite: data.nationalite || 'Gabonaise',
          genre: data.sexe || data.genre || 'M',
        };
        
        console.log('✅ Données candidat mappées:', newCandidatData);
        setCandidatData(newCandidatData);
      }

      // Mapper aussi les données du permis si disponibles
      if (data.numero_permis) {
        // Formater les dates pour les champs de type "date" (format YYYY-MM-DD)
        const formatDateForInput = (dateStr: string | null | undefined): string => {
          if (!dateStr) return '';
          // Si la date est déjà au format YYYY-MM-DD, la retourner telle quelle
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr;
          }
          // Sinon, essayer de la convertir
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('⚠️ Erreur lors du formatage de la date:', dateStr, e);
          }
          return '';
        };

        const newPermisData = {
          numero_permis: data.numero_permis || '',
          numero_origine_permis: data.numero_origine_permis || '',
          lieu_de_dobtention_du_permis: data.lieu_obtention || data.lieu_origine || '',
          date_de_dobtention_du_permis: formatDateForInput(data.date_obtention),
          date_de_delivrance_du_permis: formatDateForInput(data.date_validite),
        };
        
        setPermisData(newPermisData);
        console.log('✅ Données permis mappées:', newPermisData);
        
        // Mapper le numero_permis dans l'état numeroPermis pour l'affichage
        if (data.numero_permis) {
          setNumeroPermis(data.numero_permis);
        }
      }

      // Mapper le referenciel_id en fonction de la catégorie du permis
      if (data.categorie) {
        // La catégorie peut être "B, C" ou "B" - on prend la première catégorie
        const categories = data.categorie.split(',').map((c: string) => c.trim());
        const premiereCategorie = categories[0];
        
        // Stocker la catégorie pour le mapping ultérieur si les référentiels ne sont pas encore chargés
        setCategoriePermisRecuperee(premiereCategorie);
        
        console.log('🔍 Recherche du référentiel pour la catégorie:', premiereCategorie);
        console.log('🔍 Référentiels disponibles:', referentiels.map(r => ({ id: r.id, code: r.code, libelle: r.libelle })));
        
        // Chercher le référentiel dont le code correspond à la catégorie
        const referentielTrouve = referentiels.find(
          (ref) => ref.code && ref.code.toUpperCase() === premiereCategorie.toUpperCase()
        );
        
        if (referentielTrouve) {
          setFormationData(prev => ({
            ...prev,
            referenciel_id: referentielTrouve.id,
          }));
          console.log('✅ Référentiel trouvé et mappé:', {
            id: referentielTrouve.id,
            code: referentielTrouve.code,
            libelle: referentielTrouve.libelle,
            categorie: premiereCategorie
          });
        } else {
          console.warn('⚠️ Aucun référentiel trouvé pour la catégorie:', premiereCategorie);
          if (referentiels.length > 0) {
            console.warn('⚠️ Catégories disponibles dans les référentiels:', referentiels.map(r => r.code));
          } else {
            console.log('⏳ Référentiels non encore chargés, le mapping sera fait après le chargement');
          }
        }
      }

      // Vérifier qu'on a récupéré au moins quelques données depuis l'API
      if (!hasPersonneData && !hasCandidatData) {
        console.warn('⚠️ Aucune donnée de personne ou candidat trouvée dans la réponse de l\'API');
        console.warn('⚠️ Structure de la réponse API:', JSON.stringify(data, null, 2));
        setError('Aucune information trouvée dans l\'API pour ce numéro de permis. Vérifiez que le numéro est correct ou que les données existent dans le système.');
        return false;
      }
      
      // Vérifier que les données ne sont pas vides
      const hasValidData = 
        (hasPersonneData && (data.nom || data.prenom)) ||
        (hasCandidatData && (data.date_naissance || data.numero_identite));
      
      if (!hasValidData) {
        console.warn('⚠️ Les données de l\'API sont vides ou invalides');
        setError('Les données reçues de l\'API sont vides ou invalides pour ce numéro de permis.');
        return false;
      }

      console.log('✅ Données récupérées avec succès:', {
        hasPersonneData,
        hasCandidatData,
        personneData: hasPersonneData ? {
          nom: data.nom,
          prenom: data.prenom
        } : null,
        candidatData: hasCandidatData ? {
          date_naissance: data.date_naissance,
          lieu_naissance: data.lieu_naissance
        } : null,
        permisData: data.numero_permis ? {
          numero_permis: data.numero_permis,
          numero_origine_permis: data.numero_origine_permis,
          lieu_de_dobtention_du_permis: data.lieu_obtention || data.lieu_origine,
          date_de_dobtention_du_permis: data.date_obtention,
          date_de_delivrance_du_permis: data.date_validite,
          categorie: data.categorie
        } : null,
        referenciel_id: formationData.referenciel_id
      });


      return true;
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des données depuis l\'API:', err);
      
      // Gérer les différents types d'erreurs
      if (err.response?.status === 404) {
        setError('Aucune information trouvée dans l\'API pour ce numéro de permis. Le numéro de permis n\'existe pas dans le système.');
      } else if (err.response?.status === 400) {
        setError('Le numéro de permis fourni est invalide. Veuillez vérifier le format du numéro de permis.');
      } else if (err.response?.data?.message) {
        setError(`Erreur API: ${err.response.data.message}`);
      } else if (err.message) {
        setError(`Erreur lors de la récupération depuis l'API: ${err.message}`);
      } else {
        setError('Erreur lors de la récupération des données depuis l\'API. Veuillez réessayer plus tard.');
      }
      
      // S'assurer que les données sont bien réinitialisées en cas d'erreur
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
      setPermisData({
        numero_permis: '',
        numero_origine_permis: '',
        lieu_de_dobtention_du_permis: '',
        date_de_dobtention_du_permis: '',
        date_de_delivrance_du_permis: '',
      });
      setDataRecuperee(null);
      setCategoriePermisRecuperee(null);
      
      return false;
    } finally {
      setLoadingRecuperation(false);
    }
  };

  // Passer à l'étape suivante
  const handleNext = async () => {
    setError(null);

    const realStep = getRealStepIndex(activeStep);

    if (realStep === 0) {
      // Étape 0 : Vérifier que DUPLICATA est sélectionné
      if (!typeDemandeId) {
        setError('Veuillez sélectionner le type de demande DUPLICATA');
        return;
      }
      setActiveStep(1);
    } else if (realStep === 1) {
      // Étape 1 : Valider le numéro de permis
      if (!validateStepNumeroPermis({ 
        setError, 
        isFicheEnregistre, 
        numeroPermisParts, 
        setNumeroPermis,
        permisFormat
      })) {
        return;
      }
      setPermisData(prev => ({ ...prev, numero_permis: numeroPermis }));
      setActiveStep(2);
    } else if (realStep === 2) {
      // Étape 2 : Récupérer les données
      const success = await recupererDonnees();
      if (success) {
        setActiveStep(3);
      }
    } else if (realStep === 3) {
      // Étape 3 : Informations du permis (affichage en lecture seule)
      // On passe directement à l'étape suivante
      setActiveStep(4);
    } else if (realStep === 4) {
      // Étape 4 : Informations personnelles - Enregistrer via /auth/register
      if (!validatePersonne({ personneData, setError })) {
        return;
      }
      
      setLoading(true);
      try {
        if (!personneId) {
          const registerPayload = {
            email: personneData.email,
            telephone: personneData.telephone || personneData.contact,
            password: personneData.password,
            password_confirmation: personneData.password_confirmation,
            nom: personneData.nom,
            prenom: personneData.prenom,
            contact: personneData.contact,
            adresse: personneData.adresse || '',
            role: 'candidat',
            captcha_id: captchaId,
            captcha_code: captchaCode,
          };
          
          if (!captchaId || !captchaCode) {
            setError('Veuillez compléter le captcha avant de continuer.');
            setLoading(false);
            return;
          }
          
          console.log('📤 Enregistrement de la personne via /auth/register');
          const registerResponse = await authService.register(registerPayload);
          
          // Gérer différentes structures de réponse possibles
          let personneIdFromResponse: string | null = null;
          if (registerResponse.user?.personne?.id) {
            personneIdFromResponse = registerResponse.user.personne.id;
          } else if (registerResponse.data?.personne_id) {
            personneIdFromResponse = registerResponse.data.personne_id;
          } else if (registerResponse.personne_id) {
            personneIdFromResponse = registerResponse.personne_id;
          }
          
          if (personneIdFromResponse) {
            setPersonneId(personneIdFromResponse);
            console.log('✅ Personne créée avec ID:', personneIdFromResponse);
            setActiveStep(5);
          } else {
            setError('Erreur: Impossible de récupérer l\'ID de la personne créée.');
          }
        } else {
          // Si la personne existe déjà, passer directement à l'étape suivante
          setActiveStep(5);
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'enregistrement de la personne:', err);
        console.error('📋 Réponse d\'erreur complète:', err.response?.data);
        
        // Vérifier d'abord les erreurs de connexion Authentik dans le message d'erreur
        const errorData = err.response?.data || {};
        const errorMessage = errorData.message || err.message || 'Erreur lors de l\'enregistrement';
        const errorString = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        const errorDetail = errorData.error || '';
        const errorDetailString = typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail);
        
        console.log('🔍 Vérification erreur Authentik:');
        console.log('  - errorMessage:', errorString);
        console.log('  - errorDetail:', errorDetailString);
        
        // Vérifier si c'est une erreur de connexion Authentik
        // Vérifier dans les deux champs (message et error) et aussi dans la réponse complète
        const fullErrorText = JSON.stringify(errorData).toLowerCase();
        const isAuthentikError = 
          errorString.toLowerCase().includes('could not resolve host') ||
          errorString.toLowerCase().includes('iam.transports.gouv.ga') ||
          errorString.toLowerCase().includes('authentik') ||
          errorString.toLowerCase().includes('curl error 6') ||
          errorDetailString.toLowerCase().includes('could not resolve host') ||
          errorDetailString.toLowerCase().includes('iam.transports.gouv.ga') ||
          errorDetailString.toLowerCase().includes('authentik') ||
          errorDetailString.toLowerCase().includes('curl error 6') ||
          fullErrorText.includes('could not resolve host') ||
          fullErrorText.includes('iam.transports.gouv.ga') ||
          fullErrorText.includes('authentik') ||
          fullErrorText.includes('curl error 6');
        
        console.log('  - isAuthentikError:', isAuthentikError);
        
        if (isAuthentikError) {
          console.log('✅ Erreur Authentik détectée - Affichage message spécifique');
          setError('Erreur de connexion avec le service d\'authentification externe (Authentik). Veuillez réessayer plus tard ou contacter le support technique si le problème persiste.');
          setLoading(false);
          return;
        }
        
        // Gérer les erreurs de validation (422)
        if (err.response?.data?.errors) {
          const champsPersonne = ['nom', 'prenom', 'email', 'contact', 'telephone', 'adresse', 'password', 'password_confirmation', 'role'];
          const erreursPersonne: string[] = [];
          
          Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const fieldLower = field.toLowerCase();
            if (champsPersonne.includes(fieldLower)) {
              const messageList = Array.isArray(messages) ? messages : [messages];
              erreursPersonne.push(`${field}: ${messageList.join(', ')}`);
            }
          });
          
          if (erreursPersonne.length > 0) {
            setError(`Erreur de validation pour les informations personnelles :\n• ${erreursPersonne.join('\n• ')}`);
          } else {
            setError(errorString || 'Erreur de validation. Veuillez vérifier que tous les champs sont correctement remplis.');
          }
        } else {
          setError(errorString || 'Erreur lors de l\'enregistrement des informations personnelles.');
        }
      } finally {
        setLoading(false);
      }
    } else if (realStep === 5) {
      // Étape 5 : Informations du candidat - Enregistrer via /candidats
      if (!validateCandidat({ candidatData, setError })) {
        return;
      }
      
      setLoading(true);
      try {
        if (!personneId) {
          setError('Erreur: ID de la personne manquant. Veuillez recommencer.');
          setLoading(false);
          return;
        }
        
        if (!candidatId) {
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
          
          console.log('📤 Enregistrement du candidat via /candidats');
          const candidatResponse = await autoEcoleService.createCandidat(candidatPayload as any);
          
          if (candidatResponse.data?.id) {
            setCandidatId(candidatResponse.data.id);
            console.log('✅ Candidat créé avec ID:', candidatResponse.data.id);
            setActiveStep(6);
          } else {
            setError('Erreur: Impossible de récupérer l\'ID du candidat créé.');
          }
        } else {
          // Si le candidat existe déjà, passer directement à l'étape suivante
          setActiveStep(6);
        }
      } catch (err: any) {
        console.error('❌ Erreur lors de l\'enregistrement du candidat:', err);
        
        if (err.response?.data?.errors) {
          const champsCandidat = ['date_naissance', 'lieu_naissance', 'nip', 'type_piece', 'numero_piece', 'nationalite', 'genre', 'personne_id'];
          const erreursCandidat: string[] = [];
          
          Object.entries(err.response.data.errors).forEach(([field, messages]: [string, any]) => {
            const fieldLower = field.toLowerCase();
            if (champsCandidat.includes(fieldLower)) {
              const messageList = Array.isArray(messages) ? messages : [messages];
              erreursCandidat.push(`${field}: ${messageList.join(', ')}`);
            }
          });
          
          if (erreursCandidat.length > 0) {
            setError(`Erreur de validation pour les informations du candidat :\n• ${erreursCandidat.join('\n• ')}`);
          } else {
            setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement du candidat');
          }
        } else {
          setError(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement du candidat');
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
    if (!candidatId && !personneId) {
      setError('Erreur: Les données du candidat ou de la personne sont manquantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const dossierPayload: any = {
        candidat_id: candidatId || dataRecuperee?.candidat_id,
        type_demande_id: typeDemandeId,
        statut: 'en_attente',
        date_creation: today,
        commentaires: formationData.commentaires || undefined,
      };

      // Ajouter les informations du permis
      const numPermis = permisData.numero_permis || numeroPermis;
      if (numPermis) {
        dossierPayload.numero_permis = numPermis;
      }

      if (permisData.numero_origine_permis && permisData.numero_origine_permis.trim() !== '') {
        dossierPayload.numero_origine_permis = permisData.numero_origine_permis;
      }

      if (permisData.lieu_de_dobtention_du_permis && permisData.lieu_de_dobtention_du_permis.trim() !== '') {
        dossierPayload.lieu_de_dobtention_du_permis = permisData.lieu_de_dobtention_du_permis;
      }

      if (permisData.date_de_dobtention_du_permis) {
        const dateObtention = new Date(permisData.date_de_dobtention_du_permis);
        dossierPayload.date_de_dobtention_du_permis = dateObtention.toISOString();
      }

      if (permisData.date_de_delivrance_du_permis) {
        const dateDelivrance = new Date(permisData.date_de_delivrance_du_permis);
        dossierPayload.date_de_delivrance_du_permis = dateDelivrance.toISOString();
      }

      // Ajouter referenciel_id si fourni
      if (formationData.referenciel_id) {
        dossierPayload.referenciel_id = formationData.referenciel_id;
        
        // Si referenciel_id est fourni, chercher automatiquement l'auto-école CNEPC et sa formation correspondante
        // (même logique que dans CreateDossierForm.tsx)
        try {
          console.log('🔍 Recherche de l\'auto-école CNEPC...');
          
          // Récupérer toutes les auto-écoles
          const autoEcolesResponse = await autoEcoleService.getAutoEcoles(1, 1000, {});
          const allAutoEcoles = autoEcolesResponse.data || [];
          
          // Trouver l'auto-école CNEPC
          const cnepcAutoEcole = allAutoEcoles.find((ae: AutoEcole) => 
            ae.nom_auto_ecole && ae.nom_auto_ecole.trim().toUpperCase() === 'CNEPC'
          );
          
          if (cnepcAutoEcole) {
            console.log('✅ Auto-école CNEPC trouvée:', cnepcAutoEcole.id);
            
            // Récupérer les formations de l'auto-école CNEPC
            const cnepcFormations = await autoEcoleService.getFormationsByAutoEcole(cnepcAutoEcole.id);
            console.log(`📋 ${cnepcFormations.length} formation(s) trouvée(s) pour CNEPC`);
            
            // Trouver la formation dont le type_permis_id correspond au referenciel_id
            const matchingFormation = cnepcFormations.find((formation: any) => {
              const formationTypePermisId = formation.type_permis_id || formation.type_permis?.id;
              return formationTypePermisId === formationData.referenciel_id;
            });
            
            if (matchingFormation) {
              console.log('✅ Formation correspondante trouvée:', matchingFormation.id);
              dossierPayload.auto_ecole_id = cnepcAutoEcole.id;
              dossierPayload.formation_id = matchingFormation.id;
            } else {
              console.warn('⚠️ Aucune formation trouvée pour le type de permis:', formationData.referenciel_id);
            }
          } else {
            console.warn('⚠️ Auto-école CNEPC non trouvée');
          }
        } catch (err: any) {
          console.error('❌ Erreur lors de la recherche de l\'auto-école CNEPC:', err);
          // Ne pas bloquer la création du dossier si la recherche échoue
        }
      }
      
      console.log('📤 Payload envoyé pour la création du dossier:', JSON.stringify(dossierPayload, null, 2));
      
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
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Type de demande: <strong>DUPLICATA</strong>
            </Typography>
            {selectedTypeDemande && (
              <Typography variant="caption" color="text.secondary">
                {selectedTypeDemande.name}
              </Typography>
            )}
          </Box>
        );

      case 1:
        return (
          <NumeroPermisStep
            numeroPermisParts={numeroPermisParts}
            isFicheEnregistre={isFicheEnregistre}
            loading={loading}
            format={permisFormat}
            onNumeroPermisPartsChange={setNumeroPermisParts}
            onFormatChange={setPermisFormat}
          />
        );

      case 2:
        const numPermisAffiche = numeroPermis || buildNumeroPermis(numeroPermisParts, permisFormat);
        return (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Récupération des données pour le numéro de permis: <strong>{numPermisAffiche || 'Non renseigné'}</strong>
            </Typography>
            {loadingRecuperation && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Récupération en cours...</Typography>
              </Box>
            )}
            {error && !loadingRecuperation && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {dataRecuperee && !loadingRecuperation && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Données récupérées avec succès ! Les informations ont été pré-remplies.
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <DossierInfoStep
            permisData={permisData}
            formationData={formationData}
            referentiels={referentiels}
            loading={loading}
          />
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informations personnelles
            </Typography>
            <PersonneFormStep
              personneData={personneData}
              loading={loading}
              captchaId={captchaId}
              captchaCode={captchaCode}
              onPersonneDataChange={setPersonneData}
              onCaptchaIdChange={setCaptchaId}
              onCaptchaCodeChange={setCaptchaCode}
            />
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informations du candidat
            </Typography>
            <CandidatFormStep
              candidatData={candidatData}
              loading={loading}
              onCandidatDataChange={setCandidatData}
            />
          </Box>
        );

      case 6:
        return (
          <Box>
            <PermisInfoStep
              permisData={permisData}
              numeroPermis={numeroPermis}
              numeroPermisParts={numeroPermisParts}
              numeroOriginePermisParts={numeroOriginePermisParts}
              isFicheEnregistre={isFicheEnregistre}
              loading={loading}
              permisOrigineFormat={permisOrigineFormat}
              onPermisDataChange={setPermisData}
              onNumeroOriginePermisPartsChange={setNumeroOriginePermisParts}
              onPermisOrigineFormatChange={setPermisOrigineFormat}
            />
            <Box sx={{ mt: 4 }}>
              <FinalisationStep
                formationData={formationData}
                referentiels={referentiels}
                loadingReferentiels={loadingReferentiels}
                loading={loading}
                onFormationDataChange={setFormationData}
              />
            </Box>
          </Box>
        );

      default:
        return 'Étape inconnue';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={showForm ? <Close /> : <Add />}
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Annuler' : 'Récupération de l\'existant'}
        </Button>
      </Box>

      <Collapse in={showForm}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonAdd color="secondary" />
            <Typography variant="h6">
              Récupération de l'existant (DUPLICATA)
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
                <strong>Erreur :</strong>
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
                  disabled={loading || loadingRecuperation}
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
                  disabled={loading || loadingRecuperation}
                  endIcon={loading || loadingRecuperation ? <CircularProgress size={20} /> : <ArrowForward />}
                >
                  {loading || loadingRecuperation 
                    ? (activeStep === 2 ? 'Récupération...' : 'Chargement...')
                    : (activeStep === 2 ? 'Récupérer les données' : 'Suivant')}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading || loadingRecuperation}
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

export default RecuperationExistantForm;


