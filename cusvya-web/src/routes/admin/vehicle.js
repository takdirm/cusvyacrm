import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Vehicle = lazy(() => import('../../container/vehicle/Vehicle'));
const VehicleDetail = lazy(() => import('../../container/vehicle/overview/VehicleDetail'));
const ManageTracker = lazy(() => import('../../container/vehicle/overview/ManageTracker'));
const VehicleModel = lazy(() => import('../../container/vehicle/VehicleModel'));
const TrackerDevice = lazy(() => import('../../container/vehicle/TrackerDevice'));
const VehicleTracker = lazy(() => import('../../container/vehicle/VehicleTracker'));
const Catalogue = lazy(() => import('../../container/vehicle/Catalogue'));
const CatalogueDetail = lazy(() => import('../../container/vehicle/overview/CatalogueDetail'));
const CatalogueVehicleList = lazy(() => import('../../container/vehicle/overview/CatalogueVehicleList'));
const CatalogueOwnershipPlans = lazy(() => import('../../container/vehicle/overview/CatalogueOwnershipPlans'));
const RentalPlans = lazy(() => import('../../container/vehicle/overview/RentalPlans'));
const OwnershipPlans = lazy(() => import('../../container/vehicle/overview/OwnershipPlans'));
const VehicleModelVehiclesList = lazy(() => import('../../container/vehicle/overview/VehicleModelVehiclesList'));
const VehicleModelDetail = lazy(() => import('../../container/vehicle/overview/VehicleModelDetail'));
const AccessorieManagement = lazy(() => import('../../container/vehicle/AccessorieManagement'));

function VehicleRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Vehicle />} />
      <Route path="detail/:vehicleId" element={<VehicleDetail />} />
      <Route path="manage-tracker/:vehicleId" element={<ManageTracker />} />
      <Route path="models" element={<VehicleModel />} />
      <Route path="models/:modelId/detail" element={<VehicleModelDetail />} />
      <Route path="models/:modelId/rental-plans" element={<RentalPlans />} />
      <Route path="models/:modelId/ownership-plans" element={<OwnershipPlans />} />
      <Route path="models/:modelId/vehicles" element={<VehicleModelVehiclesList />} />
      <Route path="catalogues" element={<Catalogue />} />
      <Route path="catalogues/:catalogueId" element={<CatalogueDetail />} />
      <Route path="catalogues/:catalogueId/vehicles" element={<CatalogueVehicleList />} />
      <Route path="catalogues/:catalogueId/list-vehicles" element={<CatalogueVehicleList />} />
      <Route path="catalogues/:catalogueId/ownership-plans" element={<CatalogueOwnershipPlans />} />
      <Route path="devices" element={<TrackerDevice />} />
      <Route path="tracker" element={<VehicleTracker />} />
      <Route path="accessories" element={<AccessorieManagement />} />
      <Route path="*" element={<Vehicle />} />
    </Routes>
  );
}

export default VehicleRoutes;
