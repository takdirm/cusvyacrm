import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AuthWrapper } from './style';
import { register } from '../../../../redux/firebase/auth/actionCreator';

function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.loading);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const { name, email, password, confirmPassword } = values;

      if (password !== confirmPassword) {
        message.error('Passwords do not match');
        return;
      }

      const result = await dispatch(register({ name, email, password }));

      if (result.success) {
        message.success('Registration successful! Please sign in.');
        navigate('/auth/signin');
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('Registration failed. Please try again.');
    }
  };

  return (
    <AuthWrapper>
      <p className="auth-notice">
        Create your <strong>Wellness Web Admin</strong> account
      </p>
      <div className="auth-contents">
        <Form name="register" form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'Please enter your full name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
            ]}
          >
            <Input placeholder="Full Name" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input placeholder="Email Address" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password placeholder="Confirm Password" />
          </Form.Item>

          <Form.Item>
            <Button
              className="btn-signin"
              htmlType="submit"
              type="primary"
              size="large"
              loading={isLoading}
              disabled={isLoading}
              block
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-signup">
          <p>
            Already have an account? <Link to="/auth/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </AuthWrapper>
  );
}

export default SignUp;
