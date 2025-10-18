// Définition des routes par module
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';
import { useAppStore } from '../store';

// Import des composants de pages
import LoginPage from '../modules/auth/forms/LoginForm';
import DashboardPage from './DashboardPage';
import ValidationPage from './ValidationPage';
import ElevesPage from './ElevesPage';
import CNEPCPage from './CNEPCPage';

// Composant de protection des routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? React.createElement(React.Fragment, null, children) : React.createElement(Navigate, { to: ROUTES.LOGIN, replace: true });
};

const AppRoutes: React.FC = () => {
  return React.createElement(Routes, null,
    // Route par défaut - redirige vers le dashboard ou login
    React.createElement(Route, { 
      path: "/", 
      element: React.createElement(Navigate, { to: ROUTES.DASHBOARD, replace: true }) 
    }),
    // Route de connexion
    React.createElement(Route, { path: ROUTES.LOGIN, element: React.createElement(LoginPage) }),
    // Routes protégées
    React.createElement(Route, { 
      path: ROUTES.DASHBOARD, 
      element: React.createElement(ProtectedRoute, null, React.createElement(DashboardPage)) 
    }),
    React.createElement(Route, { 
      path: ROUTES.VALIDATION, 
      element: React.createElement(ProtectedRoute, null, React.createElement(ValidationPage)) 
    }),
    React.createElement(Route, { 
      path: ROUTES.ELEVES, 
      element: React.createElement(ProtectedRoute, null, React.createElement(ElevesPage)) 
    }),
    React.createElement(Route, { 
      path: ROUTES.CNEPC, 
      element: React.createElement(ProtectedRoute, null, React.createElement(CNEPCPage)) 
    }),
    // Route 404
    React.createElement(Route, { 
      path: "*", 
      element: React.createElement('div', null, 'Page non trouvée - 404') 
    })
  );
};

export default AppRoutes;
