/**
 * Normalise un rôle en enlevant le préfixe ROLE_ si présent
 * et gère les équivalences spéciales (admin = ROLE_CNEPC)
 * 
 * Exemples:
 * - "ROLE_CNEPC" -> "cnepc"
 * - "ROLE_AUTO_ECOLE" -> "auto_ecole"
 * - "admin" -> "cnepc"
 * - "CNEPC" -> "cnepc"
 */
export const normalizeRole = (role: string): string => {
  if (!role) return '';
  
  // Enlever le préfixe ROLE_ (insensible à la casse) et mettre en minuscules
  let normalized = role.replace(/^ROLE_/i, '').toLowerCase().trim();
  
  // Équivalence: admin = ROLE_CNEPC
  // Gérer les variations: "admin", "c nepc", "cnepc", "c_nepc"
  if (normalized === 'admin' || 
      normalized === 'c nepc' || 
      normalized === 'cnepc' ||
      normalized === 'c_nepc') {
    return 'cnepc';
  }
  
  return normalized;
};

/**
 * Vérifie si l'utilisateur est autorisé pour une étape
 * Le rôle "admin" est équivalent à "ROLE_CNEPC"
 * Si plusieurs rôles sont définis dans l'étape, l'utilisateur doit avoir l'un de ces rôles
 */
export const isUserAuthorized = (
  userRole: string | null | undefined,
  etapeRoles?: string[]
): boolean => {
  // Si aucun rôle n'est spécifié dans l'étape, tous les utilisateurs sont autorisés
  if (!etapeRoles || etapeRoles.length === 0) {
    return true;
  }
  
  // Si l'utilisateur n'a pas de rôle, il n'est pas autorisé
  if (!userRole) {
    return false;
  }

  // Normaliser le rôle de l'utilisateur
  const normalizedUserRole = normalizeRole(userRole);
  
  // Vérifier si le rôle de l'utilisateur correspond à un des rôles autorisés
  // Utiliser some() pour vérifier si l'utilisateur a au moins un des rôles requis
  const isAuthorized = etapeRoles.some(etapeRole => {
    const normalizedEtapeRole = normalizeRole(etapeRole);
    
    // Vérification directe après normalisation
    if (normalizedEtapeRole === normalizedUserRole) {
      return true;
    }
    
    // Équivalence spéciale: admin = ROLE_CNEPC
    const isUserAdmin = normalizedUserRole === 'admin' || normalizedUserRole === 'cnepc';
    const isEtapeCNEPC = normalizedEtapeRole === 'cnepc' || normalizedEtapeRole === 'admin';
    
    if (isUserAdmin && isEtapeCNEPC) {
      return true;
    }
    
    return false;
  });
  
  // Log pour débogage (peut être retiré en production)
  if (!isAuthorized) {
    console.log('🔒 Utilisateur non autorisé:', {
      userRole,
      normalizedUserRole,
      etapeRoles,
      normalizedEtapeRoles: etapeRoles.map(r => normalizeRole(r))
    });
  }
  
  return isAuthorized;
};

