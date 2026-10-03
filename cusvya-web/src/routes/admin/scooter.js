import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Scooter = lazy(() => import('../../container/scooter/Scooter'));
const ScooterDetail = lazy(() => import('../../container/scooter/overview/ScooterDetail'));
const ManageTracker = lazy(() => import('../../container/scooter/overview/ManageTracker'));
const ScooterType = lazy(() => import('../../container/scooter/ScooterType'));
const TrackerDevice = lazy(() => import('../../container/scooter/TrackerDevice'));
const ScooterTracker = lazy(() => import('../../container/scooter/ScooterTracker'));
const Catalogue = lazy(() => import('../../container/scooter/Catalogue'));
const CatalogueDetail = lazy(() => import('../../container/scooter/overview/CatalogueDetail'));
const CatalogueScooters = lazy(() => import('../../container/scooter/overview/CatalogueScooters'));
const CatalogueOwnershipPlans = lazy(() => import('../../container/scooter/overview/CatalogueOwnershipPlans'));
const RentalPlans = lazy(() => import('../../container/scooter/overview/RentalPlans'));
const OwnershipPlans = lazy(() => import('../../container/scooter/overview/OwnershipPlans'));

function ScooterRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Scooter />} />
      <Route path="detail/:scooterId" element={<ScooterDetail />} />
      <Route path="manage-tracker/:scooterId" element={<ManageTracker />} />
      <Route path="types" element={<ScooterType />} />
      <Route path="catalogues" element={<Catalogue />} />
      <Route path="catalogues/:catalogueId" element={<CatalogueDetail />} />
      <Route path="catalogues/:catalogueId/scooters" element={<CatalogueScooters />} />
      <Route path="catalogues/:catalogueId/ownership-plans" element={<CatalogueOwnershipPlans />} />
      <Route path="trackers" element={<TrackerDevice />} />
      <Route path="tracker" element={<ScooterTracker />} />
      <Route path="types/:typeId/rental-plans" element={<RentalPlans />} />
      <Route path="types/:typeId/ownership-plans" element={<OwnershipPlans />} />
      <Route path="*" element={<Scooter />} />
    </Routes>
  );
}

export default ScooterRoutes;
