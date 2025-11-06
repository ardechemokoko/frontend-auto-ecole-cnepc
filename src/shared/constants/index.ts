// Constantes globales
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VALIDATION: '/validation',
  ELEVES: '/eleves',
  DEMANDE_DETAILS: '/eleves/demandes/:id',
  ELEVE_INSCRIT_DETAILS: '/eleves/inscrits/:id',
  FORMATIONS: '/formations',
  CNEPC: '/cnepc',
  RECEPTION: '/reception',
  RECEPTION_DETAILS: '/reception/:id',
  AUTO_ECOLES: '/auto-ecoles',
  CANDIDAT_DETAILS: '/candidat/:id',
  SETTINGS: '/settings',
  USER_MANAGEMENT: '/user-management',
  UPDATE: '/updateinfo',
  PROFILE: '/profile',

  REF: '/referentiel',
  CPW: '/change-password',
  RPW: '/reset-password',
  WORKFLOW: 't',
  WORKFLOW_CIRCUIT: '/workflow/circuits',
  WORKFLOW_STATUT: '/workflow/statuts',

  // Routes pour le module candidat_examen
  CANDIDATS_EXAMEN: '/candidats-examen',
  CANDIDATS_EXAMEN_CANDIDATS: '/candidats-examen/candidats',
  CANDIDATS_EXAMEN_SESSIONS: '/candidats-examen/sessions',
  CANDIDATS_EXAMEN_PLANIFICATION: '/candidats-examen/planification',
  CANDIDATS_EXAMEN_DEMO: '/candidats-examen/demo',
  
  // SETTINGS: '/settings',
  //USER_MANAGEMENT: '/settings/users',
  //WORKFLOW: '/workflow',
 // WORKFLOW_CIRCUIT: '/workflow/circuits',
  WORKFLOW_CIRCUIT_DETAIL: '/workflow/circuits/detail/:id',
 // WORKFLOW_STATUT: '/workflow/statuts',
 
} as const;

export const STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  INCOMPLETE: 'incomplete',
  COMPLETE: 'complete',
} as const;

export const DOCUMENT_TYPES = {
  IDENTITY: 'identity',
  PHOTO: 'photo',
  MEDICAL: 'medical',
  APTITUDE: 'aptitude',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;
