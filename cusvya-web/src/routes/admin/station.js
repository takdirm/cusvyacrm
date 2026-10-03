import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Station = lazy(() => import('../../container/station/Station'));
const ManageVehicles = lazy(() => import('../../container/station/ManageVehicles'));

function StationRoutes() {
  return (
    <Routes>
      <Route path="list" element={<Station />} />
      <Route path="manage-vehicles" element={<ManageVehicles />} />
      <Route path="*" element={<Station />} />
    </Routes>
  );
}

export default StationRoutes;
