import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useSelector((state) => ({
    isLoggedIn: state.auth.login,
    loading: state.auth.loading,
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Add PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
