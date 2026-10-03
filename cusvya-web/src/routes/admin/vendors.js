import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const VendorManagement = lazy(() => import('../../container/vendors/VendorManagement'));

function VendorRoutes() {
  return (
    <Routes>
      <Route path="list" element={<VendorManagement />} />
      <Route path="*" element={<VendorManagement />} />
    </Routes>
  );
}

export default VendorRoutes;
