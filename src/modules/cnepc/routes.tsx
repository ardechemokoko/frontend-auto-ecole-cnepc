import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AutoEcoleManagement, AutoEcoleDemoPage, GestionDossierPage, UsagerDossierPage } from './index';

const CNEPCRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/auto-ecoles" element={<AutoEcoleManagement />} />
      <Route path="/auto-ecoles/demo" element={<AutoEcoleDemoPage />} />
      <Route path="/gestion-dossier" element={<GestionDossierPage />} />
      <Route path="/dossiers/:id" element={<UsagerDossierPage />} />
    </Routes>
  );
};

export default CNEPCRoutes;
