import React from 'react';
import { Provider, shallowEqual, useSelector } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd';
import { ThemeProvider } from 'styled-components';
import 'antd/dist/reset.css';
import Admin from './routes/admin';
import { AuthProvider, useAuth } from './template/auth/AuthContext';
import LoginPage from './template/pages/LoginPage';
import store from './redux/store';
import config from './config/config';
import './static/css/style.css';

const { theme } = config;

function AppRoutes() {
  const { rtl, darkMode } = useSelector(
    (state) => ({
      rtl: state.ChangeLayoutMode.rtlData,
      darkMode: state.ChangeLayoutMode.data,
    }),
    shallowEqual,
  );
  const { isAuthenticated } = useAuth();

  const antdThemeConfig = {
    algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme['primary-color'],
      colorBgContainer: theme['card-background'],
      colorBgLayout: theme['layout-body-background'],
      colorText: theme['text-color'],
      fontFamily: theme['font-family'],
    },
  };

  return (
    <ThemeProvider theme={{ ...theme, rtl }}>
      <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} theme={antdThemeConfig}>
        <AntApp>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin/*"
              element={
                isAuthenticated ? <Admin /> : <Navigate to="/login" replace />
              }
            />
            <Route path="/" element={<Navigate to="/admin/dashboard/overview" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard/overview" replace />} />
          </Routes>
        </AntApp>
      </ConfigProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
