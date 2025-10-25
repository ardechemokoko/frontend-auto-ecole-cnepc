// Constantes globales
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VALIDATION: '/validation',
  ELEVES: '/eleves',
  CNEPC: '/cnepc',
  UPDATE: '/updateinfo',
  SETTINGS: '/settings',
  USER_MANAGEMENT: '/settings/users',
  WORKFLOW: '/workflow',
  WORKFLOW_CIRCUIT: '/workflow/circuits',
  WORKFLOW_STATUT: '/workflow/statuts',
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
