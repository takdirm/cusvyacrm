import React, { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const CompanySettings = lazy(() => import('../../container/settings/CompanySettings'));

function AppSettingsRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/settings/company" replace />} />
      <Route path="company" element={<CompanySettings />} />
      <Route path="*" element={<Navigate to="/admin/settings/company" replace />} />
    </Routes>
  );
}
export default AppSettingsRoutes;
