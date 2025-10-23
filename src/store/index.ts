// Store global avec React Context (alternative à Zustand)
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { User } from '../modules/auth/types';
import tokenService from '../modules/auth/services/tokenService';

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
      const token = tokenService.getToken();
      const userData = localStorage.getItem('user_data');
      
      // Pour les mocks, on vérifie simplement la présence du token et des données utilisateur
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Vérifier si c'est un token mock (commence par "mock-jwt-token")
          if (token.startsWith('mock-jwt-token')) {
            dispatch({ type: 'RESTORE_AUTH', payload: { user, token } });
          } else if (tokenService.isTokenValid()) {
            // Pour les vrais tokens JWT
            dispatch({ type: 'RESTORE_AUTH', payload: { user, token } });
          } else {
            // Token invalide, nettoyer
            tokenService.clearAll();
            localStorage.removeItem('user_data');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } catch (error) {
          console.error('Erreur lors de la restauration de l\'authentification:', error);
          tokenService.clearAll();
          localStorage.removeItem('user_data');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Pas de token ou de données utilisateur, nettoyer
        tokenService.clearAll();
        localStorage.removeItem('user_data');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreAuth();
  }, []);

  const login = (user: User, token: string) => {
    // Sauvegarder dans localStorage
    tokenService.setToken(token);
    localStorage.setItem('user_data', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { user, token } });
  };

  const logout = () => {
    // Nettoyer le localStorage
    tokenService.clearAll();
    localStorage.removeItem('user_data');
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
