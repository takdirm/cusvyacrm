import React from 'react';
import { AppstoreOutlined, SettingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Customer' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
];

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260}>
        <div style={{ color: '#fff', padding: 20, fontSize: 18, fontWeight: 600 }}>Cusvya Template</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(item) => navigate(item.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <Typography.Title style={{ margin: 0 }} level={4}>
            Reusable Application Template
          </Typography.Title>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Typography.Text>{profile?.name || profile?.email || 'Logged in user'}</Typography.Text>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </Header>
        <Content style={{ margin: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
