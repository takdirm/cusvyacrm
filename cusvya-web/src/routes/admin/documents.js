import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const DocumentTemplatesManagement = lazy(() => import('../../container/documents/DocumentTemplatesManagement'));

function DocumentRoutes() {
  return (
    <Routes>
      <Route path="templates" element={<DocumentTemplatesManagement />} />
      <Route path="*" element={<Navigate to="templates" replace />} />
    </Routes>
  );
}

export default DocumentRoutes;
