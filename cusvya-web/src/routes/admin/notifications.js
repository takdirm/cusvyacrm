import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const NotificationTypes = lazy(() => import('../../container/notifications/NotificationTypes'));
const NotificationTemplatesManagement = lazy(
  () => import('../../container/notifications/NotificationTemplatesManagement'),
);
const NotificationLogs = lazy(() => import('../../container/notifications/NotificationLogs'));

function NotificationRoutes() {
  return (
    <Routes>
      <Route path="types" element={<NotificationTypes />} />
      <Route path="templates" element={<NotificationTemplatesManagement />} />
      <Route path="logs" element={<NotificationLogs />} />
      <Route path="*" element={<Navigate to="types" replace />} />
    </Routes>
  );
}

export default NotificationRoutes;
