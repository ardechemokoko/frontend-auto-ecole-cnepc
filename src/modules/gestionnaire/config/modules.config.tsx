import React from 'react';
import {
  Send,
  School,
  People,
  Assignment,
  TrendingUp,
  AutoAwesome,
  Quiz,
  Schedule,
  Category,
  Description,
  Settings,
  PersonAdd,
} from '@mui/icons-material';
import { ROUTES } from '../../../shared/constants';
import { ModuleCardProps } from '../types';

export const getModulesConfig = (
  navigate: (path: string) => void,
  onCompleteSetup: () => void
): ModuleCardProps[] => [
  {
    title: 'Gestion des Auto-Écoles',
    description:
      'Gérez vos auto-écoles, consultez les candidats inscrits, suivez l\'avancement des dossiers et analysez les statistiques.',
    icon: <School />,
    badge: {
      label: 'Module Principal',
      color: 'primary',
    },
    chips: [
      { icon: <People />, label: 'Candidats' },
      { icon: <Assignment />, label: 'Dossiers' },
      { icon: <TrendingUp />, label: 'Statistiques' },
    ],
    primaryAction: {
      label: 'Accéder au Module',
      icon: <School />,
      onClick: () => navigate(ROUTES.AUTO_ECOLES),
    },
    secondaryAction: {
      label: 'Configuration Complète',
      icon: <PersonAdd />,
      onClick: onCompleteSetup,
    },
    avatarColor: 'primary',
  },
  {
    title: 'Candidats aux Examens',
    description:
      'Gérez les candidats aux examens, organisez les sessions d\'examen et planifiez les créneaux pour les 3 épreuves du permis de conduire.',
    icon: <Quiz />,
    badge: {
      label: 'Nouveau Module',
      color: 'success',
    },
    chips: [
      { icon: <People />, label: 'Candidats' },
      { icon: <Schedule />, label: 'Sessions' },
      { icon: <Quiz />, label: 'Épreuves' },
    ],
    primaryAction: {
      label: 'Accéder au Module',
      icon: <Quiz />,
      onClick: () => navigate(ROUTES.CANDIDATS_EXAMEN),
    },
    secondaryAction: {
      label: 'Sessions d\'Examen',
      icon: <Schedule />,
      onClick: () => navigate(ROUTES.CANDIDATS_EXAMEN_SESSIONS),
    },
    avatarColor: 'success',
  },
  {
    title: 'Reception au CNEPC',
    description:
      'Interface de réception des dossiers candidats au CNEPC. Gérez la réception, la validation et le suivi des dossiers transmis par les auto-écoles.',
    icon: <Send />,
    badge: {
      label: 'Module Disponible',
      color: 'success',
    },
    chips: [
      { icon: <AutoAwesome />, label: 'Validation' },
      { icon: <Send />, label: 'Réception' },
      { icon: <Assignment />, label: 'Suivi' },
    ],
    primaryAction: {
      label: 'Accéder au Module',
      icon: <Send />,
      onClick: () => navigate(ROUTES.RECEPTION),
    },
    avatarColor: 'secondary',
  },
  {
    title: 'Typage de Dossier',
    description:
      'Gérez les types de demande pour les dossiers candidats. Créez, modifiez et supprimez les différents types de demande disponibles dans le système.',
    icon: <Category />,
    badge: {
      label: 'Module Disponible',
      color: 'info',
    },
    chips: [
      { icon: <Category />, label: 'Types' },
      { icon: <Assignment />, label: 'Dossiers' },
      { icon: <AutoAwesome />, label: 'Gestion' },
    ],
    primaryAction: {
      label: 'Accéder au Module',
      icon: <Category />,
      onClick: () => navigate(ROUTES.TYPE_DEMANDES),
    },
    avatarColor: 'info',
  },
  {
    title: 'Pièces Justificatives et Referentiels',
    description:
      'Gérez les pièces justificatives requises pour les dossiers candidats et les référentiels du système. Créez, modifiez et supprimez les différentes pièces justificatives et référentiels disponibles.',
    icon: <Description />,
    badge: {
      label: 'Module Disponible',
      color: 'warning',
    },
    chips: [
      { icon: <Description />, label: 'Documents' },
      { icon: <Settings />, label: 'Référentiels' },
      { icon: <Assignment />, label: 'Validation' },
      { icon: <AutoAwesome />, label: 'Gestion' },
    ],
    primaryAction: {
      label: 'Accéder au Module',
      icon: <Description />,
      onClick: () => navigate(ROUTES.PIECES_JUSTIFICATIVES),
    },
    avatarColor: 'warning',
  },
];

