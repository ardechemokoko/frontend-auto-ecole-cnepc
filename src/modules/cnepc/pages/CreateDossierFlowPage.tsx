import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Button,
  Grid,
  Divider,
  StepIconProps,
  styled,
} from '@mui/material';
import {
  ArrowBack,
  Description,
  Info,
  CheckCircle,
  RadioButtonUnchecked,
  Circle,
} from '@mui/icons-material';
import { CreateDossierProvider, useCreateDossier } from '../contexts/CreateDossierContext';
import { useFormations } from '../forms/hooks';
import { checkIsDuplicata, checkIsFicheEnregistre } from '../forms/utils';

// Pages pour chaque étape - Direct imports to avoid Vite module resolution issues
// Updated: 2024-01-XX - Using direct imports instead of React.lazy
import TypeDemandePage from './steps/TypeDemandePage';
import AutoEcoleFormationPage from './steps/AutoEcoleFormationPage';
import NumeroPermisPage from './steps/NumeroPermisPage';
import PermisInfoPage from './steps/PermisInfoPage';
import PermisOriginePage from './steps/PermisOriginePage';
import PermisBOriginePage from './steps/PermisBOriginePage';
import PersonneFormPage from './steps/PersonneFormPage';
import CandidatFormPage from './steps/CandidatFormPage';
import CandidatRecapPage from './steps/CandidatRecapPage';
import FinalisationPage from './steps/FinalisationPage';

// Composant StepIcon personnalisé avec style moderne
const CustomStepIcon = styled('div')<StepIconProps & { active?: boolean; completed?: boolean }>(
  ({ theme, active, completed }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: completed || active ? 'white' : theme.palette.text.secondary,
    background: completed
      ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
      : active
      ? 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
    boxShadow: completed
      ? '0 4px 12px rgba(76, 175, 80, 0.4)'
      : active
      ? '0 4px 12px rgba(25, 118, 210, 0.4)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    zIndex: 1,
    transform: 'scale(1)',
    ...(active && {
      animation: 'pulse 2s infinite, scaleIn 0.5s ease',
      '@keyframes pulse': {
        '0%': {
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
        },
        '50%': {
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.6)',
        },
        '100%': {
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
        },
      },
      '@keyframes scaleIn': {
        '0%': {
          transform: 'scale(0.8)',
          opacity: 0.7,
        },
        '100%': {
          transform: 'scale(1)',
          opacity: 1,
        },
      },
    }),
    ...(completed && {
      animation: 'checkmark 0.6s ease',
      '@keyframes checkmark': {
        '0%': {
          transform: 'scale(0.8) rotate(-180deg)',
          opacity: 0,
        },
        '50%': {
          transform: 'scale(1.1) rotate(10deg)',
        },
        '100%': {
          transform: 'scale(1) rotate(0deg)',
          opacity: 1,
        },
      },
    }),
    '&:hover': {
      transform: 'scale(1.1)',
      transition: 'transform 0.3s ease',
    },
  })
);

const StepIconComponent: React.FC<StepIconProps> = ({ active, completed, icon }) => {
  return (
    <CustomStepIcon active={active} completed={completed} icon={icon}>
      {completed ? (
        <CheckCircle sx={{ fontSize: 24, color: 'white' }} />
      ) : active ? (
        <Circle sx={{ fontSize: 20, color: 'white' }} />
      ) : (
        <RadioButtonUnchecked sx={{ fontSize: 20 }} />
      )}
    </CustomStepIcon>
  );
};

const CreateDossierFlowContent: React.FC = () => {
  const navigate = useNavigate();
  const { step } = useParams<{ step: string }>();
  const currentStep = parseInt(step || '0', 10);
  
  const {
    isNouveauPermis,
    selectedTypeDemande,
    needsPermisOrigine,
    isFormationTypeC,
    candidatMode,
    selectedCandidat,
    candidatId,
    candidatTrouveFromPermisPrincipal,
    candidatTrouveFromPermisOrigine,
    permisPrincipalVerified,
    numeroPermisParts,
  } = useCreateDossier();

  const { formations } = useFormations();

  // Déterminer les étapes dynamiquement
  const getSteps = (): string[] => {
    const baseSteps = ['Type de demande'];
    const isDuplicata = selectedTypeDemande ? checkIsDuplicata(selectedTypeDemande.name) : false;
    const isFicheEnregistreType = selectedTypeDemande ? checkIsFicheEnregistre(selectedTypeDemande.name) : false;
    const candidatTrouve = candidatTrouveFromPermisPrincipal || candidatTrouveFromPermisOrigine;
    const hasExistingCandidat = candidatMode === 'existing' && selectedCandidat && candidatId;
    
    if (isNouveauPermis) {
      baseSteps.push('Auto-école et Formation');
      if (isFormationTypeC(formations || [])) {
        baseSteps.push('Permis B d\'origine');
      }
    } else {
      baseSteps.push('Numéro de permis');
      baseSteps.push('Informations du permis');
      // Pour fiche d'enregistrement, vérifier la catégorie pour déterminer si c'est Permis B d'origine
      // L'étape "Permis d'origine" n'est présente que si la catégorie est C, D ou E (comme pour duplicata)
      if (isFicheEnregistreType) {
        const categorie = numeroPermisParts?.categorie?.toUpperCase().trim() || '';
        // Vérifier directement si la catégorie est C, D ou E
        const hasCategorieCDE = ['C', 'D', 'E'].includes(categorie);
        
        console.log('🔍 [CreateDossierFlowPage] getSteps - Vérification catégorie pour stepper:', {
          categorie,
          hasCategorieCDE,
          numeroPermisPartsCategorie: numeroPermisParts?.categorie,
          candidatTrouve,
        });
        
        // Pour catégorie C, D ou E : TOUJOURS ajouter Permis B d'origine (même si candidat trouvé)
        // Pour les autres catégories, on n'ajoute pas d'étape de permis d'origine
        if (hasCategorieCDE) {
          baseSteps.push('Permis B d\'origine');
        }
      } else if (needsPermisOrigine() && !isFicheEnregistreType) {
        baseSteps.push('Permis d\'origine');
      }
    }
    
    // Pour fiche d'enregistrement, déterminer les étapes suivantes selon la catégorie
    if (isFicheEnregistreType) {
      const categorie = numeroPermisParts?.categorie?.toUpperCase().trim() || '';
      const hasCategorieCDE = ['C', 'D', 'E'].includes(categorie);
      
      if (hasCategorieCDE) {
        // Pour catégorie C, D ou E : après PermisBOrigine, afficher CandidatRecap si candidat trouvé, sinon PersonneForm puis CandidatForm
        if (candidatTrouve || hasExistingCandidat) {
          baseSteps.push('Récapitulatif candidat');
        } else {
          baseSteps.push('Informations personnelles', 'Informations du candidat');
        }
      } else {
        // Pour autre catégorie
        if (candidatTrouve || hasExistingCandidat) {
          baseSteps.push('Récapitulatif candidat');
        } else {
          baseSteps.push('Informations personnelles', 'Informations du candidat');
        }
      }
    } else if (isDuplicata) {
      // Pour duplicata
      if (candidatTrouve || hasExistingCandidat) {
        // Si candidat trouvé → Récapitulatif candidat
        baseSteps.push('Récapitulatif candidat');
      } else {
        // Si pas de candidat trouvé → Informations personnelles puis Informations du candidat
        baseSteps.push('Informations personnelles', 'Informations du candidat');
      }
    } else if (!hasExistingCandidat) {
      // Pour les autres cas, si un candidat a été trouvé après vérification du permis, afficher CandidatRecap
      if (candidatTrouve && (needsPermisOrigine() || permisPrincipalVerified)) {
        baseSteps.push('Récapitulatif candidat');
      } else {
        baseSteps.push('Informations personnelles', 'Informations du candidat');
      }
    }
    
    baseSteps.push('Finalisation');
    return baseSteps;
  };

  const steps = getSteps();


  // Navigation
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      navigate(`/gestion-dossier/create/${currentStep + 1}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      navigate(`/gestion-dossier/create/${currentStep - 1}`);
    } else {
      navigate('/gestion-dossier');
    }
  };

  // Obtenir le contenu de l'étape actuelle
  const getStepContent = () => {
    const hasExistingCandidat = candidatMode === 'existing' && selectedCandidat && candidatId;
    const hasPermisOrigine = needsPermisOrigine();
    const isDuplicata = selectedTypeDemande ? checkIsDuplicata(selectedTypeDemande.name) : false;
    const isFicheEnregistreType = selectedTypeDemande ? checkIsFicheEnregistre(selectedTypeDemande.name) : false;
    const candidatTrouve = candidatTrouveFromPermisPrincipal || candidatTrouveFromPermisOrigine;

    // Debug logs
    console.log('🔍 [CreateDossierFlowPage] getStepContent:', {
      currentStep,
      isNouveauPermis,
      isDuplicata,
      isFicheEnregistreType,
      selectedTypeDemandeName: selectedTypeDemande?.name,
      candidatTrouve,
      candidatTrouveFromPermisPrincipal: !!candidatTrouveFromPermisPrincipal,
      candidatTrouveFromPermisOrigine: !!candidatTrouveFromPermisOrigine,
      hasExistingCandidat,
      hasPermisOrigine,
      permisPrincipalVerified,
      numeroPermisParts,
      categorie: numeroPermisParts?.categorie,
    });

    if (currentStep === 0) {
      return <TypeDemandePage onNext={handleNext} onBack={handleBack} />;
    }

    if (isNouveauPermis) {
      if (currentStep === 1) {
        return <AutoEcoleFormationPage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 2 && isFormationTypeC(formations || [])) {
        return <PermisBOriginePage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 3 && isFormationTypeC(formations || [])) {
        // Récapitulatif ou PersonneFormStep selon si candidat trouvé
        return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 4 && !hasExistingCandidat) {
        return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 5 && !hasExistingCandidat) {
        return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
      }
      return <FinalisationPage onBack={handleBack} />;
    } else {
      if (currentStep === 1) {
        return <NumeroPermisPage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 2) {
        return <PermisInfoPage onNext={handleNext} onBack={handleBack} />;
      }
      // Après l'identification du permis (étape 2), pour fiche d'enregistrement
      if (currentStep === 3 && isFicheEnregistreType && permisPrincipalVerified) {
        // Vérifier si la catégorie contient C, D ou E
        const categorieRaw = numeroPermisParts?.categorie;
        const categorie = categorieRaw ? String(categorieRaw).toUpperCase().trim() : '';
        const hasCategorieCDE = categorie && ['C', 'D', 'E'].includes(categorie);
        
        console.log('🔍 [CreateDossierFlowPage] Vérification pour fiche d\'enregistrement:', {
          categorieRaw,
          categorie,
          hasCategorieCDE,
          candidatTrouve,
          numeroPermisParts: numeroPermisParts,
          numeroPermisPartsCategorie: numeroPermisParts?.categorie,
          numeroPermisPartsCategorieType: typeof numeroPermisParts?.categorie,
          numeroPermisPartsCategorieLength: numeroPermisParts?.categorie?.length,
          currentStep,
          permisPrincipalVerified,
        });
        
        if (!categorie) {
          console.error('❌ [CreateDossierFlowPage] ERREUR: La catégorie est vide pour fiche d\'enregistrement!', {
            numeroPermisParts,
            note: 'Si plusieurs catégories étaient disponibles, assurez-vous d\'avoir sélectionné une catégorie dans le select',
          });
        }
        
        // Pour catégorie C, D ou E : TOUJOURS afficher PermisBOriginePage (même si candidat trouvé)
        // Pour les autres catégories, on n'affiche pas d'étape de permis d'origine (comme pour duplicata)
        if (hasCategorieCDE) {
          // Catégorie C, D ou E → PermisBOriginePage (obligatoire)
          console.log('✅ [CreateDossierFlowPage] Affichage PermisBOriginePage pour fiche d\'enregistrement C/D/E (obligatoire)');
          return <PermisBOriginePage onNext={handleNext} onBack={handleBack} />;
        } else {
          // Autre catégorie (pas C, D, E) → pas d'étape de permis d'origine, aller directement au candidat
          if (candidatTrouve) {
            // Candidat trouvé → CandidatRecapPage
            console.log('✅ [CreateDossierFlowPage] Affichage CandidatRecapPage pour fiche d\'enregistrement (candidat trouvé, catégorie non C/D/E)');
            return <CandidatRecapPage onNext={handleNext} onBack={handleBack} />;
          } else {
            // Pas de candidat → PersonneFormPage d'abord
            console.log('✅ [CreateDossierFlowPage] Affichage PersonneFormPage pour fiche d\'enregistrement (pas de candidat, catégorie non C/D/E)', {
              categorie,
              hasCategorieCDE,
              raison: !categorie ? 'Catégorie vide' : `Catégorie "${categorie}" n'est pas C, D ou E`,
            });
            return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
          }
        }
      }
      // Après PermisBOriginePage pour fiche d'enregistrement avec catégorie C, D ou E
      if (currentStep === 4 && isFicheEnregistreType && permisPrincipalVerified) {
        const categorieRaw = numeroPermisParts?.categorie;
        const categorie = categorieRaw ? String(categorieRaw).toUpperCase().trim() : '';
        const hasCategorieCDE = categorie && ['C', 'D', 'E'].includes(categorie);
        
        if (hasCategorieCDE) {
          // Après PermisBOriginePage, si candidat trouvé → CandidatRecapPage
          if (candidatTrouve) {
            console.log('✅ [CreateDossierFlowPage] Affichage CandidatRecapPage pour fiche d\'enregistrement C/D/E après PermisBOrigine (candidat trouvé)');
            return <CandidatRecapPage onNext={handleNext} onBack={handleBack} />;
          } else {
            // Pas de candidat → PersonneFormPage d'abord
            console.log('✅ [CreateDossierFlowPage] Affichage PersonneFormPage pour fiche d\'enregistrement C/D/E après PermisBOrigine (pas de candidat)');
            return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
          }
        }
      }
      // Après PersonneFormPage pour fiche d'enregistrement, afficher CandidatFormPage
      if (currentStep === 4 && isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        const categorieRaw = numeroPermisParts?.categorie;
        const categorie = categorieRaw ? String(categorieRaw).toUpperCase().trim() : '';
        const hasCategorieCDE = categorie && ['C', 'D', 'E'].includes(categorie);
        
        // Si ce n'est pas une catégorie C, D, E, on est après PersonneFormPage (étape 3 → étape 4)
        if (!hasCategorieCDE) {
          console.log('✅ [CreateDossierFlowPage] Affichage CandidatFormPage pour fiche d\'enregistrement après PersonneFormPage (catégorie non C/D/E)');
          return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
        }
      }
      // Après PersonneFormPage pour fiche d'enregistrement avec catégorie C, D, E (étape 4 → étape 5)
      if (currentStep === 5 && isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        const categorieRaw = numeroPermisParts?.categorie;
        const categorie = categorieRaw ? String(categorieRaw).toUpperCase().trim() || '' : '';
        const hasCategorieCDE = categorie && ['C', 'D', 'E'].includes(categorie);
        
        if (hasCategorieCDE) {
          console.log('✅ [CreateDossierFlowPage] Affichage CandidatFormPage pour fiche d\'enregistrement après PersonneFormPage (catégorie C/D/E)');
          return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
        }
      }
      // Après CandidatRecapPage pour fiche d'enregistrement, aller directement à Finalisation
      if (currentStep === 5 && isFicheEnregistreType && hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatRecapPage (fiche d\'enregistrement)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Après CandidatFormPage pour fiche d'enregistrement, aller à Finalisation
      if (currentStep === 6 && isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatFormPage (fiche d\'enregistrement)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Logique pour duplicata (sans permis d'origine)
      if (currentStep === 3 && !hasPermisOrigine && !isFicheEnregistreType) {
        if (isDuplicata && candidatTrouve) {
          // Duplicata avec candidat trouvé → CandidatRecapPage
          console.log('✅ [CreateDossierFlowPage] Affichage CandidatRecapPage pour duplicata (candidat trouvé)');
          return <CandidatRecapPage onNext={handleNext} onBack={handleBack} />;
        } else if (isDuplicata && !candidatTrouve) {
          // Duplicata sans candidat trouvé → PersonneFormPage
          console.log('✅ [CreateDossierFlowPage] Affichage PersonneFormPage pour duplicata (pas de candidat trouvé)');
          return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
        } else {
          console.log('⚠️ [CreateDossierFlowPage] Affichage PersonneFormPage (pas duplicata ou pas de candidat trouvé)');
          return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
        }
      }
      // Après PersonneFormPage pour duplicata (sans permis d'origine), afficher CandidatFormPage
      if (currentStep === 4 && isDuplicata && !hasPermisOrigine && !isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage CandidatFormPage pour duplicata après PersonneFormPage');
        return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
      }
      // Logique pour duplicata avec permis d'origine
      if (currentStep === 3 && hasPermisOrigine && !isFicheEnregistreType) {
        return <PermisOriginePage onNext={handleNext} onBack={handleBack} />;
      }
      // Après PermisOriginePage, vérifier si un candidat a été trouvé
      if (currentStep === 4 && hasPermisOrigine && !isFicheEnregistreType) {
        // Si un candidat a été trouvé (duplicata ou autre type), afficher CandidatRecapPage
        if (candidatTrouve && !hasExistingCandidat) {
          console.log('✅ [CreateDossierFlowPage] Affichage CandidatRecapPage après PermisOrigine (candidat trouvé)', {
            isDuplicata,
            candidatTrouveFromPermisOrigine: !!candidatTrouveFromPermisOrigine,
            candidatTrouveFromPermisPrincipal: !!candidatTrouveFromPermisPrincipal,
          });
          return <CandidatRecapPage onNext={handleNext} onBack={handleBack} />;
        } else if (!candidatTrouve && !hasExistingCandidat) {
          // Pas de candidat trouvé → PersonneFormPage
          console.log('⚠️ [CreateDossierFlowPage] Affichage PersonneFormPage après PermisOrigine (pas de candidat trouvé)');
          return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
        }
      }
      // Après PersonneFormPage pour duplicata avec permis d'origine, afficher CandidatFormPage
      if (currentStep === 5 && isDuplicata && hasPermisOrigine && !isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage CandidatFormPage pour duplicata après PersonneFormPage (avec permis d\'origine)');
        return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
      }
      // Après CandidatRecapPage pour duplicata, aller directement à Finalisation
      if (currentStep === 4 && isDuplicata && hasExistingCandidat && !isFicheEnregistreType) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatRecapPage (duplicata)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Après CandidatFormPage pour duplicata (sans permis d'origine), aller à Finalisation
      if (currentStep === 5 && isDuplicata && !hasPermisOrigine && !isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatFormPage (duplicata sans permis d\'origine)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Après CandidatFormPage pour duplicata (avec permis d'origine), aller à Finalisation
      if (currentStep === 6 && isDuplicata && hasPermisOrigine && !isFicheEnregistreType && !candidatTrouve && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatFormPage (duplicata avec permis d\'origine)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Cas généraux (non duplicata, non fiche d'enregistrement)
      if (currentStep === 3 && !hasPermisOrigine && !isDuplicata && !isFicheEnregistreType) {
        // Vérifier si un candidat a été trouvé après la vérification du permis principal
        if (candidatTrouve && !hasExistingCandidat) {
          console.log('✅ [CreateDossierFlowPage] Affichage CandidatRecapPage (candidat trouvé après permis principal)');
          return <CandidatRecapPage onNext={handleNext} onBack={handleBack} />;
        }
        return <PersonneFormPage onNext={handleNext} onBack={handleBack} />;
      }
      // Après CandidatRecapPage pour cas généraux, aller directement à Finalisation
      if (currentStep === 4 && !isDuplicata && !isFicheEnregistreType && hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatRecapPage (cas général)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Après PersonneFormPage (étape 4 ou 5 selon si permis d'origine) - seulement pour les cas non fiche d'enregistrement
      if (currentStep === 5 && !isFicheEnregistreType && !needsPermisOrigine() && !hasExistingCandidat) {
        return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
      }
      if (currentStep === 5 && !isFicheEnregistreType && needsPermisOrigine() && !hasExistingCandidat) {
        return <CandidatFormPage onNext={handleNext} onBack={handleBack} />;
      }
      // Après CandidatFormPage pour cas généraux (non fiche d'enregistrement), aller à Finalisation
      if (currentStep === 6 && !isFicheEnregistreType && !hasExistingCandidat) {
        console.log('✅ [CreateDossierFlowPage] Affichage FinalisationPage après CandidatFormPage (cas général)');
        return <FinalisationPage onBack={handleBack} />;
      }
      // Cas par défaut - seulement si ce n'est pas une fiche d'enregistrement
      if (!isFicheEnregistreType) {
        return <FinalisationPage onBack={handleBack} />;
      }
      // Pour fiche d'enregistrement, si on arrive ici sans condition spécifique, retourner Finalisation
      return <FinalisationPage onBack={handleBack} />;
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Sidebar à gauche */}
        <Grid
          item
          xs={12}
          md={4}
          lg={3}
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
            color: 'white',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url(/assets/img/drapeau_sceau.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.1,
              zIndex: 0,
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Contenu centré verticalement */}
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              {/* Logo et titre du ministère */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Box
                  component="img"
                  src="/assets/img/mtt.png"
                  alt="Ministère des Transports"
                  sx={{
                    maxWidth: '120px',
                    height: 'auto',
                    mb: 3,
                    filter: 'brightness(0) invert(1)',
                    mx: 'auto',
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  Ministère des Transports Publics de la Marchandise et de la Logistique
                </Typography>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    textAlign: 'center',
                    opacity: 0.95,
                  }}
                >
                  Direction Générale des Transports Terrestres
                </Typography>
              </Box>

              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 3 }} />

              {/* Description de la page */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Description sx={{ mr: 1.5, fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Création de Dossier
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  sx={{ mb: 3, lineHeight: 1.8, opacity: 0.95, textAlign: 'center' }}
                >
                  Cette application vous permet de créer et gérer les dossiers de candidats pour les permis de conduire.
                  Suivez les étapes du formulaire ci-contre pour compléter toutes les informations nécessaires.
                </Typography>

                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', mb: 2 }}>
                    <Info sx={{ mr: 1.5, mt: 0.5, fontSize: 20 }} />
                    <Box sx={{ maxWidth: '90%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                        À propos
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.7, textAlign: 'center' }}>
                        Cette plateforme est développée et maintenue par la Direction Générale des Transports Terrestres
                        dans le cadre de la modernisation des services administratifs du Ministère des Transports Publics
                        de la Marchandise et de la Logistique.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Footer de la sidebar */}
              <Box sx={{ mt: 4, pt: 3, textAlign: 'center' }}>
                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 2 }} />
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                  © {new Date().getFullYear()} - Tous droits réservés
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Contenu principal à droite */}
        <Grid item xs={12} md={8} lg={9} sx={{ p: { xs: 2, sm: 4, md: 6 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Création de Dossier
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Suivez les étapes pour créer un nouveau dossier
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/gestion-dossier')}
              sx={{
                borderRadius: 0,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                border: 'None',
                borderColor: 'None',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  background: 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateX(-4px)',
                },
              }}
            >
              Retour à la gestion
            </Button>
          </Box>

          <Paper
            sx={{
              p: 4,
              borderRadius: 0,
              boxShadow: 'None',
              background: 'linear-gradient(135deg,rgba(255, 255, 255, 0) 0%,rgba(250, 250, 250, 0) 100%)',
            }}
          >
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg,rgba(245, 247, 250, 0) 0%,rgba(232, 236, 241, 0) 100%)',
                border: 'None',
                borderColor: 'None',
                elevation: 5,
              }}
            >
              <Stepper
                activeStep={currentStep}
                sx={{
                  '& .MuiStep-root': {
                    '&:last-child .MuiStepConnector-root': {
                      display: 'none',
                    },
                  },
                  '& .MuiStepConnector-root': {
                    top: 20,
                    left: 'calc(-50% + 20px)',
                    right: 'calc(50% + 20px)',
                    '& .MuiStepConnector-line': {
                      borderTopWidth: 3,
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#e0e0e0',
                      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transition: 'left 0.6s ease',
                      },
                    },
                  },
                  '& .MuiStepConnector-active .MuiStepConnector-line': {
                    borderColor: 'primary.main',
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                    borderImage: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%) 1',
                    animation: 'fillLine 0.8s ease forwards',
                    '&::before': {
                      left: '100%',
                    },
                    '@keyframes fillLine': {
                      '0%': {
                        borderColor: '#e0e0e0',
                        width: '0%',
                      },
                      '100%': {
                        borderColor: 'primary.main',
                        width: '100%',
                      },
                    },
                  },
                  '& .MuiStepConnector-completed .MuiStepConnector-line': {
                    borderColor: '#4caf50',
                    background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
                    borderImage: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%) 1',
                    animation: 'fillLineCompleted 0.6s ease forwards',
                    '@keyframes fillLineCompleted': {
                      '0%': {
                        borderColor: '#e0e0e0',
                      },
                      '100%': {
                        borderColor: '#4caf50',
                      },
                    },
                  },
                  '& .MuiStepLabel-root': {
                    transition: 'all 0.4s ease',
                    '& .MuiStepLabel-label': {
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: 'text.primary',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      '&.Mui-active': {
                        color: 'primary.main',
                        fontWeight: 700,
                        animation: 'fadeInScale 0.5s ease',
                        '@keyframes fadeInScale': {
                          '0%': {
                            opacity: 0.7,
                            transform: 'scale(0.95)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                        },
                      },
                      '&.Mui-completed': {
                        color: '#4caf50',
                        fontWeight: 600,
                        transition: 'color 0.4s ease',
                      },
                    },
                  },
                }}
              >
                {steps.map((label, index) => (
                  <Step key={label} completed={index < currentStep} active={index === currentStep}>
                    <StepLabel
                      StepIconComponent={StepIconComponent}
                      sx={{
                        '& .MuiStepLabel-labelContainer': {
                          '& .MuiStepLabel-label': {
                            position: 'relative',
                            '&::after': index === currentStep
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  bottom: -4,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '60%',
                                  height: 3,
                                  borderRadius: 2,
                                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                                  animation: 'slideIn 0.3s ease',
                                  '@keyframes slideIn': {
                                    from: {
                                      width: 0,
                                    },
                                    to: {
                                      width: '60%',
                                    },
                                  },
                                }
                              : {},
                          },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box
              sx={{
                minHeight: '400px',
                position: 'relative',
                '& > *': {
                  animation: 'fadeInSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  '@keyframes fadeInSlide': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                },
              }}
            >
              {getStepContent()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const CreateDossierFlowPage: React.FC = () => {
  return (
    <CreateDossierProvider>
      <CreateDossierFlowContent />
    </CreateDossierProvider>
  );
};

export default CreateDossierFlowPage;

