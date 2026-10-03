import React, { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Catalogue = lazy(() => import('../../container/vehicle/Catalogue'));
const CatalogueDetail = lazy(() => import('../../container/vehicle/overview/CatalogueDetail'));
const CatalogueVehicleList = lazy(() => import('../../container/vehicle/overview/CatalogueVehicleList'));
const CatalogueOwnershipPlans = lazy(() => import('../../container/vehicle/overview/CatalogueOwnershipPlans'));
const CatalogueManageVehicles = lazy(() => import('../../container/catalogue/ManageVehicles'));

function CatalogueRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Catalogue />} />
      <Route path="list/:catalogueId" element={<CatalogueDetail />} />
      <Route path="list/:catalogueId/vehicles" element={<CatalogueVehicleList />} />
      <Route path="list/:catalogueId/list-vehicles" element={<CatalogueVehicleList />} />
      <Route path="list/:catalogueId/ownership-plans" element={<CatalogueOwnershipPlans />} />
      <Route path="manage-vehicles" element={<CatalogueManageVehicles />} />
      <Route path="*" element={<Catalogue />} />
    </Routes>
  );
}

export default CatalogueRoutes;
