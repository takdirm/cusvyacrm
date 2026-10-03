import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../container/profile/authentication/Index';

const Login = lazy(() => import('../container/profile/authentication/overview/SignIn'));
const SignUp = lazy(() => import('../container/profile/authentication/overview/Signup'));
const ForgotPass = lazy(() => import('../container/profile/authentication/overview/ForgotPassword'));

function NotFound() {
  return <Navigate to="/" replace />;
}

function FrontendRoutes() {
  return (
    <Routes>
      <Route
        path="/forgotPassword"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <ForgotPass />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <SignUp />
          </Suspense>
        }
      />

      <Route
        path="/"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <Login />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense
            fallback={
              <div className="spin">
                <Spin />
              </div>
            }
          >
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default AuthLayout(FrontendRoutes);
