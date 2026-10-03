import React, { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import { Navigate, Route, Routes } from 'react-router-dom';
import Users from './users';
import DashboardRoutes from './dashboard';

import withAdminLayout from '../../layout/withAdminLayout';
const Settings = lazy(() => import('./settings'));
const Customers = lazy(() => import('./customer'));
function Admin() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard/overview" replace />} />
      <Route path="/*" element={<DashboardRoutes />} />
      <Route
        path="users/*"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <Users />
          </Suspense>
        }
      />
      <Route
        path="settings/*"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <Settings />
          </Suspense>
        }
      />
      <Route
        path="customer/*"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <Customers />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/admin/dashboard/overview" replace />} />
    </Routes>
  );
}

export default withAdminLayout(Admin);
