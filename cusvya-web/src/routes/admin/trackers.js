import React, { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const TrackerDevice = lazy(() => import('../../container/vehicle/TrackerDevice'));
const VehicleTracker = lazy(() => import('../../container/vehicle/VehicleTracker'));
const TerminalLogs = lazy(() => import('../../container/trackers/TerminalLogs'));
const LocationLogs = lazy(() => import('../../container/trackers/LocationLogs'));
const HeartbeatLogs = lazy(() => import('../../container/trackers/HeartbeatLogs'));

function TrackerRoutes() {
  return (
    <Routes>
      <Route path="devices" element={<TrackerDevice />} />
      <Route path="tracker" element={<VehicleTracker />} />
      <Route path="terminal-logs" element={<TerminalLogs />} />
      <Route path="location-logs" element={<LocationLogs />} />
      <Route path="heartbeat-logs" element={<HeartbeatLogs />} />
      <Route path="*" element={<TrackerDevice />} />
    </Routes>
  );
}

export default TrackerRoutes;
