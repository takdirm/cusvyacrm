import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateWebLoginWithApi } from '../services/apiAuthService';
import { signInTemplateFirebase } from '../services/firebaseAuthService';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const { idToken } = await signInTemplateFirebase(values.email, values.password);
      const profile = await validateWebLoginWithApi(idToken);
      login(idToken, profile);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f5f5' }}>
      <Card title="Cusvya Web Login" style={{ width: 400 }}>
        <Typography.Paragraph>
          Login uses Firebase Authentication and validates token with Cusvya API.
        </Typography.Paragraph>
        {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />}
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Email is required.' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password is required.' }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
