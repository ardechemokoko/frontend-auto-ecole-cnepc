// Configuration API
export const API_CONFIG = {
  BASE_URL: (import.meta as any).env?.VITE_API_URL || 'https://api.artech-agency.site/api',
  TIMEOUT: 10000, // 10 secondes
  RETRY_ATTEMPTS: 3,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  STUDENTS: {
    LIST: '/students',
    CREATE: '/students',
    UPDATE: (id: string) => `/students/${id}`,
    DELETE: (id: string) => `/students/${id}`,
    DOCUMENTS: (id: string) => `/students/${id}/documents`,
  },
  VALIDATION: {
    LIST: '/validation/students',
    VALIDATE: '/validation/validate',
    REJECT: '/validation/reject',
    HISTORY: '/validation/history',
  },
  CNEPC: {
    BATCHES: '/cnepc/batches',
    SEND: '/cnepc/send-batch',
    STATUS: '/cnepc/status',
    HISTORY: '/cnepc/history',
  },
  HEALTH: '/health',
} as const;
