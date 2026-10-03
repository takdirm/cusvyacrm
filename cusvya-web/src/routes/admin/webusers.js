import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Users = lazy(() => import('../../container/user/User'));

function UsersRoute() {
  return (
    <Routes>
      <Route path="uview" element={<Users />} />
    </Routes>
  );
}

export default UsersRoute;
