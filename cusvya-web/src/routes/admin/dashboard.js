import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';

const OverviewDashboard = lazy(() => import('../../container/dashboard/regional/OverviewDashboard'));

const suspense = (element) => (
  <Suspense
    fallback={
      <div className="spin">
        <Spin />
      </div>
    }
  >
    {element}
  </Suspense>
);

function DashboardRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="/admin/dashboard/overview" replace />} />
      <Route path="dashboard" element={<Navigate to="/admin/dashboard/overview" replace />} />
      <Route path="dashboard/overview" element={suspense(<OverviewDashboard />)} />
      <Route path="*" element={<Navigate to="/admin/dashboard/overview" replace />} />
    </Routes>
  );
}

export default DashboardRoutes;
