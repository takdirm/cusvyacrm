import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Select, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { AuthWrapper } from './style';
import { CheckboxStyle } from '../../../../components/checkbox/style';

import { login } from '../../../../redux/firebase/auth/actionCreator';
import { selectRegion } from '../../../../redux/region/actionCreator';
import { API } from '../../../../config/api';
import { setSelectedRegion as persistSelectedRegion, getSelectedRegion } from '../../../../utility/localStorageControl';

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.loading);
  const [form] = Form.useForm();
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [selectedRegion, setSelectedRegionState] = useState(null);
  const [state, setState] = useState({
    checked: false,
  });

  // Fetch regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const apiEndpoint = (
          window.runtimeConfig?.REACT_APP_API_ENDPOINT ||
          process.env.REACT_APP_API_ENDPOINT ||
          ''
        ).replace(/\/+$/, '');
        const path = (API.region.path || '').replace(/^\/+/, '');
        const url = `${apiEndpoint}/${path}`;

        const response = await axios.get(url);
        const regionsList = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setRegions(regionsList);

        // Try to get previously selected region from localStorage
        const previouslySelectedRegion = getSelectedRegion();
        let defaultRegion = null;

        if (previouslySelectedRegion && regionsList.length > 0) {
          // Find the previously selected region in the current list
          defaultRegion = regionsList.find((region) => region.code === previouslySelectedRegion.code);
        }

        // If previously selected region not found, use the first one
        if (!defaultRegion && regionsList.length > 0) {
          defaultRegion = regionsList[0];
        }

        if (defaultRegion) {
          setSelectedRegionState(defaultRegion);
        }
      } catch (error) {
        console.error('Failed to load regions:', error);
        message.error('Failed to load regions');
      } finally {
        setRegionsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const { email, password } = values;

      if (!email || !password) {
        message.error('Please enter email and password');
        return;
      }

      if (!selectedRegion) {
        message.error('Please select a region');
        return;
      }

      // Clear stale region value in Redux before login flow resolves.
      await dispatch(selectRegion(null));

      const result = await dispatch(login(email, password));

      if (result && result.success) {
        // Persist and synchronize selected region to Redux immediately.
        persistSelectedRegion(selectedRegion);
        await dispatch(selectRegion(selectedRegion));
        navigate('/admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Login failed. Please try again.');
    }
  };

  const onChange = (checked) => {
    setState({ checked });
  };

  return (
    <AuthWrapper>
      <p className="auth-notice">
        Sign in to <strong>Scootr</strong>
      </p>
      <div className="auth-contents">
        <Spin spinning={regionsLoading}>
          <Form name="login" form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please enter your email!', type: 'email' }]}
              initialValue=""
            >
              <Input type="email" placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
              initialValue=""
            >
              <Input.Password placeholder="Password" />
            </Form.Item>

            <Form.Item label="Region" rules={[{ required: true, message: 'Please select a region!' }]}>
              <Select
                value={selectedRegion?.code || undefined}
                placeholder="Select Region"
                onChange={(value) => {
                  const selected = regions.find((r) => r.code === value);
                  setSelectedRegionState(selected || null);
                }}
                options={regions.map((region) => ({
                  value: region.code,
                  label: `${region.name} (${region.city})`,
                }))}
                disabled={regionsLoading}
              />
            </Form.Item>

            <div className="auth-form-action">
              <CheckboxStyle>
                <Checkbox checked={state.checked} onChange={onChange}>
                  Keep me logged in
                </Checkbox>
              </CheckboxStyle>
              <Link className="forgot-pass-link" to="/forgotPassword">
                Forgot password?
              </Link>
            </div>

            <Form.Item>
              <Button
                className="btn-signin"
                htmlType="submit"
                type="primary"
                size="large"
                loading={isLoading}
                disabled={isLoading || regionsLoading}
                block
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-signup">
            <p>
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </Spin>
      </div>
    </AuthWrapper>
  );
}

export default SignIn;
