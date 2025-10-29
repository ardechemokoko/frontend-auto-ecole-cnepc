// Types et interfaces pour l'authentification
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'instructor' | 'student' | 'candidat' | 'responsable_auto_ecole';
  createdAt?: Date;
  created_at?: string;
  updated_at?: string;
  personne?: {
    id: string;
    nom: string;
    prenom: string;
    nom_complet: string;
    email: string;
    contact: string;
    adresse: string;
  };
}

// Interface pour la réponse de l'endpoint /auth/me
export interface MeResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    created_at: string;
    personne: {
      id: string;
      nom: string;
      prenom: string;
      nom_complet: string;
      email: string;
      contact: string;
      adresse: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  access_token:string | null
  refresh_token:string | null

}
