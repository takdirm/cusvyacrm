import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Customer = lazy(() => import('../../container/customer/Customer'));

function CustomerRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Customer />} />
      <Route path="*" element={<Customer />} />
    </Routes>
  );
}

export default CustomerRoutes;
