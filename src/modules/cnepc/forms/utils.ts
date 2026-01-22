import { NumeroPermisParts, PermisFormatType } from './types';

/**
 * Construit le numéro de permis complet selon le format choisi
 * Format standard: AAAA-P-C-NNNN
 * Format OP: PERM-XXXXXX (lettres et chiffres)
 */
export const buildNumeroPermis = (parts: NumeroPermisParts, format: PermisFormatType = 'standard'): string => {
  if (format === 'op') {
    // Format OP: L'utilisateur saisit le numéro complet exactement comme il le souhaite
    if (!parts.numero || parts.numero.trim() === '') {
      return '';
    }
    // Retourner le numéro tel quel, sans ajouter de préfixe
    // L'utilisateur peut saisir "PERM-12345678", "PERM12345678", "12345678", etc.
    return parts.numero.trim();
  }
  
  // Format standard: AAAA-P-C-NNNN
  if (!parts.annee || !parts.province || !parts.categorie || !parts.numero || parts.numero.length < 4) {
    return '';
  }
  return `${parts.annee}-${parts.province}-${parts.categorie.toUpperCase()}-${parts.numero}`;
};

/**
 * Construit le numéro de permis d'origine complet selon le format choisi
 */
export const buildNumeroOriginePermis = (parts: NumeroPermisParts, format: PermisFormatType = 'standard'): string => {
  if (format === 'op') {
    // Format OP: L'utilisateur saisit le numéro complet exactement comme il le souhaite
    if (!parts.numero || parts.numero.trim() === '') {
      return '';
    }
    // Retourner le numéro tel quel, sans ajouter de préfixe
    // L'utilisateur peut saisir "PERM-12345678", "PERM12345678", "12345678", etc.
    return parts.numero.trim();
  }
  
  // Format standard: AAAA-P-C-NNNN
  if (!parts.annee || !parts.province || !parts.categorie || !parts.numero || parts.numero.length < 4) {
    return '';
  }
  return `${parts.annee}-${parts.province}-${parts.categorie.toUpperCase()}-${parts.numero}`;
};

/**
 * Valide le format du numéro de permis
 * Formats acceptés:
 * - Standard: AAAA-P-C-NNNN où:
 *   - AAAA = année (4 chiffres)
 *   - P = province (1 chiffre de 1 à 9)
 *   - C = catégorie (1 lettre)
 *   - NNNN = numéro (minimum 4 chiffres)
 * - OP: PERM-XXXXXX où XXXXXX peut contenir lettres et chiffres
 */
export const validateNumeroPermisFormat = (numPermis: string): boolean => {
  // Format standard: AAAA-P-C-NNNN
  const standardPattern = /^(\d{4})-([1-9])-([A-Z])-(\d{4,})$/i;
  // Format OP: PERM-XXXXXX ou PERMXXXXXX (lettres et chiffres acceptés après PERM)
  const opPattern = /^PERM-?([A-Z0-9]+)$/i;
  
  return standardPattern.test(numPermis) || opPattern.test(numPermis);
};

/**
 * Extrait la catégorie d'un numéro de permis complet
 * Fonctionne uniquement pour le format standard (AAAA-P-C-NNNN)
 */
export const extractCategorieFromNumeroPermis = (numPermis: string): string => {
  if (!numPermis) return '';
  
  // Format OP n'a pas de catégorie
  if (numPermis.toUpperCase().startsWith('PERM')) {
    return '';
  }
  
  // Format standard: AAAA-P-C-NNNNN
  const parts = numPermis.split('-');
  if (parts.length >= 3) {
    return parts[2].toUpperCase();
  }
  return '';
};

/**
 * Vérifie si un type de demande est un "nouveau permis"
 */
export const checkIsNouveauPermis = (typeDemandeName: string): boolean => {
  const nameLower = typeDemandeName.toLowerCase();
  return nameLower.includes('nouveau permis') || 
         (nameLower.includes('nouveau') && nameLower.includes('permis')) ||
         nameLower === 'nouveau permis';
};

/**
 * Vérifie si un type de demande est une "fiche d'enregistrement"
 */
export const checkIsFicheEnregistre = (typeDemandeName: string): boolean => {
  const nameLower = typeDemandeName.toLowerCase();
  return nameLower.includes('fiche') && nameLower.includes('enregistre') ||
         nameLower.includes('fiche d\'enregistre') ||
         nameLower.includes('enregistre');
};

/**
 * Vérifie si un type de demande est un "duplicata"
 */
export const checkIsDuplicata = (typeDemandeName: string): boolean => {
  const nameLower = typeDemandeName.toLowerCase();
  return nameLower.includes('duplicata') || nameLower.includes('duplicate');
};

/**
 * Obtient le libellé d'un champ pour les messages d'erreur
 */
export const getFieldLabel = (field: string): string => {
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

