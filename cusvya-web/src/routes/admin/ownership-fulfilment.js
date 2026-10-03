import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const OwnershipFulfilmentList = lazy(() => import('../../container/ownership-fulfilment/OwnershipFulfilmentList'));
const OwnershipFulfilmentDetail = lazy(() => import('../../container/ownership-fulfilment/OwnershipFulfilmentDetail'));

function OwnershipFulfilmentRoutes() {
  return (
    <Routes>
      <Route path="list" element={<OwnershipFulfilmentList />} />
      <Route path="detail/:id" element={<OwnershipFulfilmentDetail />} />
      <Route path="booking/:bookingId" element={<OwnershipFulfilmentDetail />} />
      <Route path="*" element={<OwnershipFulfilmentList />} />
    </Routes>
  );
}

export default OwnershipFulfilmentRoutes;
