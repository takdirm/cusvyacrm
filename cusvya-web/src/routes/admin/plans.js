import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const RentalPlansPage = lazy(() => import('../../container/plans/RentalPlans'));
const OwnershipPlansPage = lazy(() => import('../../container/plans/OwnershipPlans'));
const RentalPlanDetailsPage = lazy(() => import('../../container/plans/RentalPlanDetailsPage'));

function PlansRoutes() {
  return (
    <Routes>
      <Route path="rental" element={<RentalPlansPage />} />
      <Route path="rental/:planId/details" element={<RentalPlanDetailsPage />} />
      <Route path="ownership" element={<OwnershipPlansPage />} />
      <Route path="*" element={<RentalPlansPage />} />
    </Routes>
  );
}

export default PlansRoutes;
