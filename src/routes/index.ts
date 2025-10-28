// Définition des routes par module
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../shared/constants';
import { useAppStore } from '../store';
import AppLayout from '../shared/components/AppLayout';

// Import des composants de pages
import LoginPage from '../modules/auth/forms/LoginForm';
import DashboardPage from './DashboardPage';
import ValidationPage from './ValidationPage';
import ElevesPage from './ElevesPage';
import CNEPCPage from './CNEPCPage';


import PageUpdateAutoecole from '../modules/cnepc/forms/updateinfoAutoEcole'
import PageReferenciel from '../modules/cnepc/forms/referentiel';
import { CandidateDetailsPage } from '../modules/cnepc/pages';
import SettingsPage from '../modules/settings/pages/SettingsPage';
import UserManagementPage from '../modules/settings/pages/UserManagementPage';
import AutoEcolePage from './AutoEcolePage';

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

       // reset password 
    React.createElement(Route, { path: ROUTES.RPW, element: React.createElement(ResetPasswordForm) }),

     //   React.createElement(Route, { path: ROUTES.UPDATE, element: React.createElement(PageUpdateAutoecole) }),
    // Routes protégées avec layout
    React.createElement(Route, { 
      path: ROUTES.DASHBOARD, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(DashboardPage))
      ) 
    }),
     React.createElement(Route, { 
      path: ROUTES.UPDATE, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(PageUpdateAutoecole))
      ) 
    }),
      React.createElement(Route, { 
      path: ROUTES.REF, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(PageReferenciel))
      ) 
    }),
    React.createElement(Route, { 
      path: ROUTES.VALIDATION, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(ValidationPage))
      ) 
    }),
    React.createElement(Route, { 
      path: ROUTES.ELEVES + "/*", 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(ElevesPage))
      ) 
    }),
    React.createElement(Route, { 
      path: ROUTES.CNEPC, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(CNEPCPage))
      ) 
    }),
    React.createElement(Route, { 
      path: ROUTES.AUTO_ECOLES, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(AutoEcolePage))
      ) 
    }),
    React.createElement(Route, { 
      path: ROUTES.UPDATE, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(PageUpdateAutoecole))
      ) 
    }),
        // Routes changement de mot de passe
    React.createElement(Route, { 
      path: ROUTES.CPW, 
      element: React.createElement(ProtectedRoute, null, 
        React.createElement(AppLayout, null, React.createElement(PageChangePassWord))
      ) 
    }),
    // Routes Settings
    // React.createElement(Route, { 
    //   path: ROUTES.SETTINGS, 
    //   element: React.createElement(ProtectedRoute, null, 
    //     React.createElement(AppLayout, null, React.createElement(SettingsPage))
    //   ) 
    // }),
    // React.createElement(Route, { 
    //   path: ROUTES.USER_MANAGEMENT, 
    //   element: React.createElement(ProtectedRoute, null, 
    //     React.createElement(AppLayout, null, React.createElement(UserManagementPage))
    //   ) 
    // }),
    // Route 404
    React.createElement(Route, { 
      path: "*", 
      element: React.createElement('div', null, 'Page non trouvée - 404') 
    })
  );
};

export default AppRoutes;
