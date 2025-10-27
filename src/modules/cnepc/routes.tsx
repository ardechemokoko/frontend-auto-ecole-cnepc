import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AutoEcoleManagement, AutoEcoleDemoPage } from './index';

const CNEPCRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/auto-ecoles" element={<AutoEcoleManagement />} />
      <Route path="/auto-ecoles/demo" element={<AutoEcoleDemoPage />} />
    </Routes>
  );
};

export default CNEPCRoutes;
