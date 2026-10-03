import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Users = lazy(() => import('../../container/user/User'));

function PagesRoute() {
  return (
    <Routes>
      <Route path="*" element={<Users />} />
    </Routes>
  );
}

export default PagesRoute;
