// Système de permissions basé sur les rôles
import { User } from '../../modules/auth/types';

// Définition des permissions
export const PERMISSIONS = {
  // Permissions Admin
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ALL_DATA: 'view_all_data',
  MANAGE_REFERENTIEL: 'manage_referentiel',
  
  // Permissions Responsable Auto-École
  MANAGE_CANDIDATES: 'manage_candidates',
  VALIDATE_DOSSIERS: 'validate_dossiers',
  SEND_CNEPC: 'send_cnepc',
  UPDATE_INFO: 'update_info',
} as const;

// Configuration des permissions par rôle
export const ROLE_PERMISSIONS = {
  ROLE_ADMIN: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.MANAGE_CANDIDATES,
    PERMISSIONS.VALIDATE_DOSSIERS,
    PERMISSIONS.SEND_CNEPC,
    PERMISSIONS.UPDATE_INFO,
    PERMISSIONS.MANAGE_REFERENTIEL,
  ],
  Admin: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.MANAGE_CANDIDATES,
    PERMISSIONS.VALIDATE_DOSSIERS,
    PERMISSIONS.SEND_CNEPC,
    PERMISSIONS.UPDATE_INFO,
    PERMISSIONS.MANAGE_REFERENTIEL,
  ],
  ROLE_AUTO_ECOLE: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_CANDIDATES,
    PERMISSIONS.VALIDATE_DOSSIERS,
    PERMISSIONS.SEND_CNEPC,
    PERMISSIONS.UPDATE_INFO,
  ],
  // Rôles sans permissions spécifiques (accès limité)
  instructor: [],
  student: [],
  candidat: [],
} as const;

// Fonction pour vérifier si un utilisateur a une permission
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) {
    console.log('🔒 hasPermission: Pas d\'utilisateur connecté');
    return false;
  }
  
  console.log('🔒 hasPermission: Vérification pour', {
    userRole: user.role,
    permission,
    availableRoles: Object.keys(ROLE_PERMISSIONS)
  });
  
  const userPermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [];
  const hasAccess = (userPermissions as readonly string[]).includes(permission);
  
  console.log('🔒 hasPermission: Résultat', {
    userPermissions,
    hasAccess
  });
  
  return hasAccess;
}

// Fonction pour vérifier si un utilisateur a accès à un menu
export function canAccessMenu(user: User | null, menuKey: string): boolean {
  if (!user) {
    console.log('🔒 canAccessMenu: Pas d\'utilisateur connecté');
    return false;
  }
  
  console.log('🔒 canAccessMenu: Vérification d\'accès au menu', {
    userRole: user.role,
    menuKey,
    userName: user.name || user.email
  });
  
  const menuPermissions: Record<string, string> = {
    'dashboard': PERMISSIONS.VIEW_DASHBOARD,
    'candidates': PERMISSIONS.MANAGE_CANDIDATES,
    'validation': PERMISSIONS.VALIDATE_DOSSIERS,
    'cnepc': PERMISSIONS.SEND_CNEPC,
    'settings': PERMISSIONS.MANAGE_SETTINGS,
    'update': PERMISSIONS.UPDATE_INFO,
    'referentiel': PERMISSIONS.MANAGE_REFERENTIEL,
  };
  
  const requiredPermission = menuPermissions[menuKey];
  if (!requiredPermission) {
    console.log('🔒 canAccessMenu: Menu sans restriction', menuKey);
    return true; // Menu sans restriction
  }
  
  const hasAccess = hasPermission(user, requiredPermission);
  console.log('🔒 canAccessMenu: Résultat d\'accès', {
    menuKey,
    requiredPermission,
    hasAccess
  });
  
  return hasAccess;
}
