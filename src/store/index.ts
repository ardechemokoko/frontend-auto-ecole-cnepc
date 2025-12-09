// Store global avec React Context (alternative à Zustand)
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User } from '../modules/auth/types';
import tokenService from '../modules/auth/services/tokenService';
import { authService } from '../modules/auth/services/authService';

// Interface pour l'état d'authentification
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Types d'actions
type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_AUTH'; payload: { user: User; token: string } };

// État initial
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Commencer en loading pour vérifier l'auth
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Context
interface AppContextType extends AuthState {
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurer l'état d'authentification au chargement de l'app
  useEffect(() => {
    const restoreAuth = async () => {
      // Essayer d'abord avec access_token (utilisé par l'API)
      let token = tokenService.getTokenApi();
      let userData = tokenService.getUser();
      
      // Si pas trouvé, essayer avec auth_token (fallback)
      if (!token) {
        token = tokenService.getToken();
        userData = localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!) : null;
      }
      
      console.log('🔄 Restauration de l\'authentification...');
      console.log('  • Token trouvé:', !!token);
      console.log('  • User data trouvé:', !!userData);
      console.log('  • Token clé utilisée:', token ? (localStorage.getItem('access_token') ? 'access_token' : 'auth_token') : 'aucune');
      
      if (token && userData) {
        try {
          // Vérifier si c'est un token mock (commence par "mock-jwt-token")
          if (token.startsWith('mock-jwt-token')) {
            console.log('✅ Token mock détecté, restauration de l\'auth');
            dispatch({ type: 'RESTORE_AUTH', payload: { user: userData, token } });
          } else {
            // Vérifier si le token est valide
            const isValid = tokenService.isTokenValid();
            if (isValid) {
              console.log('✅ Token JWT valide, restauration de l\'auth');
              dispatch({ type: 'RESTORE_AUTH', payload: { user: userData, token } });
            } else {
              // Token expiré ou invalide, mais on restaure quand même la session
              // Les intercepteurs axios géreront le refresh automatiquement si nécessaire
              console.log('⚠️ Token expiré ou invalide, restauration de la session quand même');
              console.log('ℹ️ Les intercepteurs axios géreront le refresh automatiquement');
              dispatch({ type: 'RESTORE_AUTH', payload: { user: userData, token } });
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors de la restauration de l\'authentification:', error);
          // En cas d'erreur, essayer quand même de restaurer si le token et l'utilisateur existent
          console.log('⚠️ Tentative de restauration malgré l\'erreur...');
          try {
            dispatch({ type: 'RESTORE_AUTH', payload: { user: userData, token } });
          } catch (restoreError) {
            console.error('❌ Échec de la restauration, nettoyage');
            tokenService.clearAll();
            localStorage.removeItem('user_data');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        }
      } else {
        console.log('❌ Pas de token ou de données utilisateur, nettoyage');
        // Pas de token ou de données utilisateur, nettoyer
        tokenService.clearAll();
        localStorage.removeItem('user_data');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreAuth();
  }, []);

  const login = (user: User, token: string) => {
    // Sauvegarder dans localStorage avec les deux clés pour compatibilité
    tokenService.setToken(token); // auth_token
    tokenService.setAuthData(token, user); // access_token + user
    localStorage.setItem('user_data', JSON.stringify(user)); // user_data (fallback)
    dispatch({ type: 'LOGIN', payload: { user, token } });
  };

  const logout = () => {
    // Nettoyer le localStorage
    tokenService.clearAll();
    localStorage.removeItem('user_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auto_ecole_info');
    dispatch({ type: 'LOGOUT' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const value: AppContextType = {
    ...state,
    login,
    logout,
    setLoading,
  };

  return React.createElement(AppContext.Provider, { value }, children);
};

// Hook pour utiliser le store
export const useAppStore = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
