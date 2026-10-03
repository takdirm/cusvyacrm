import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const OwnershipPriceEstimation = lazy(() => import('../../container/price-estimation/OwnershipPriceEstimation'));
const OwnershipCataloguePriceEstimation = lazy(
  () => import('../../container/price-estimation/OwnershipCataloguePriceEstimation'),
);
const RentalPriceEstimation = lazy(() => import('../../container/price-estimation/RentalPriceEstimation'));

function PriceEstimationRoutes() {
  return (
    <Routes>
      <Route path="ownership" element={<Navigate to="used-vehicle" replace />} />
      <Route path="ownership/used-vehicle" element={<OwnershipPriceEstimation />} />
      <Route path="ownership/new-vehicle" element={<OwnershipCataloguePriceEstimation />} />
      <Route path="rental" element={<RentalPriceEstimation />} />
      <Route path="*" element={<Navigate to="ownership/used-vehicle" replace />} />
    </Routes>
  );
}

export default PriceEstimationRoutes;
