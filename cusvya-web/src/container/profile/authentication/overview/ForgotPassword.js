import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { AuthWrapper } from './style';
import Heading from '../../../../components/heading/heading';
import { firebaseAuth } from '../../../../config/firebase/firebase';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await firebaseAuth.resetPassword(values.email);

      if (result.success) {
        message.success('Password reset email sent. Please check your inbox.');
      } else {
        message.error(result.error || 'Unable to send reset email.');
      }
    } catch (error) {
      message.error('Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper>
      <div className="auth-contents">
        <Form name="forgotPass" onFinish={handleSubmit} layout="vertical">
          <Heading as="h3">Forgot Password?</Heading>
          <p className="forgot-text">
            Enter the email address you used when you joined and we’ll send you instructions to reset your password.
          </p>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[{ required: true, message: 'Please input your email!', type: 'email' }]}
          >
            <Input type="email" placeholder="name@example.com" />
          </Form.Item>
          <Form.Item>
            <Button
              className="btn-reset"
              htmlType="submit"
              type="primary"
              size="large"
              loading={loading}
              disabled={loading}
            >
              Send Reset Instructions
            </Button>
          </Form.Item>
          <p className="return-text">
            Return to <NavLink to="/login">Sign In</NavLink>
          </p>
        </Form>
      </div>
    </AuthWrapper>
  );
}

export default ForgotPassword;
