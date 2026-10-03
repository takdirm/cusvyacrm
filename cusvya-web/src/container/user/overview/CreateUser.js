import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Switch, App } from 'antd';
import { useDispatch } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import propTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { axiosDataSubmit } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

const { Option } = Select;

const toLevelString = (level) => {
  if (level === null || level === undefined) return 'Staff';
  const normalized = String(level).trim().toLowerCase();

  if (normalized === '0' || normalized === 'customer') return 'Customer';
  if (normalized === '1' || normalized === 'staff') return 'Staff';
  if (normalized === '2' || normalized === 'admin') return 'Admin';

  return 'Staff';
};

function CreateUser({ visible, onCancel, onSuccess }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    visible,
    modalType: 'primary',
    isSubmitting: false,
  });

  useEffect(() => {
    let unmounted = false;
    if (!unmounted) {
      setState((prevState) => ({
        ...prevState,
        visible,
      }));
    }
    return () => {
      unmounted = true;
    };
  }, [visible]);

  const handleOk = async (values) => {
    try {
      setState((prevState) => ({ ...prevState, isSubmitting: true }));

      // Create user DTO with the form values
      const userDto = {
        name: values.name,
        username: values.username,
        email: values.email,
        phone: values.phone,
        level: toLevelString(values.level),
        isActive: values.isActive !== undefined ? values.isActive : true,
      };

      // Dispatch the create action
      await dispatch(axiosDataSubmit(API.user.path, userDto));

      message.success('User created successfully!');

      // Reset form and close modal
      form.resetFields();

      // Call onSuccess callback to refresh the list
      if (onSuccess) {
        onSuccess();
      }

      onCancel();
    } catch (error) {
      console.error('Error creating user:', error);
      message.error(error?.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setState((prevState) => ({ ...prevState, isSubmitting: false }));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Handle form submission
  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        handleOk(values);
      })
      .catch((errorInfo) => {
        console.log('Validation Failed:', errorInfo);
      });
  };

  return (
    <Modal
      type={state.modalType}
      title="Create New User"
      visible={state.visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" key="back" outlined onClick={handleCancel} disabled={state.isSubmitting}>
            Cancel
          </Button>
          <Button size="default" type="primary" key="submit" onClick={handleSubmit} loading={state.isSubmitting}>
            {state.isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={600}
    >
      <div className="project-modal">
        <BasicFormWrapper>
          <Form
            layout="vertical"
            form={form}
            name="createUser"
            onFinish={handleOk}
            disabled={state.isSubmitting}
            initialValues={{
              level: 'Staff',
              isActive: true,
            }}
          >
            {/* User Information */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>
                <FeatherIcon icon="user" size={18} style={{ marginRight: '8px' }} />
                User Information
              </h4>

              <Form.Item
                name="name"
                label="Full Name"
                rules={[
                  { required: true, message: 'Please enter full name!' },
                  { min: 2, message: 'Name must be at least 2 characters!' },
                  { max: 100, message: 'Name cannot exceed 100 characters!' },
                  {
                    pattern: /^[a-zA-Z\s]+$/,
                    message: 'Name can only contain letters and spaces!',
                  },
                ]}
              >
                <Input placeholder="Enter full name" prefix={<FeatherIcon icon="user" size={16} />} />
              </Form.Item>

              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Please enter username!' },
                  { min: 3, message: 'Username must be at least 3 characters!' },
                  { max: 50, message: 'Username cannot exceed 50 characters!' },
                  {
                    pattern: /^[a-zA-Z0-9_-]+$/,
                    message: 'Username can only contain letters, numbers, hyphens and underscores!',
                  },
                ]}
              >
                <Input placeholder="Enter username" prefix={<FeatherIcon icon="at-sign" size={16} />} />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter email address!' },
                  { type: 'email', message: 'Please enter a valid email address!' },
                ]}
              >
                <Input placeholder="user@example.com" prefix={<FeatherIcon icon="mail" size={16} />} />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter phone number!' },
                  { min: 8, message: 'Phone number looks too short!' },
                ]}
              >
                <Input placeholder="+1234567890" prefix={<FeatherIcon icon="phone" size={16} />} />
              </Form.Item>
            </div>

            {/* User Access & Settings */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>
                <FeatherIcon icon="settings" size={18} style={{ marginRight: '8px' }} />
                Access & Settings
              </h4>

              <Form.Item
                name="level"
                label="Access Level"
                rules={[{ required: true, message: 'Please select access level!' }]}
              >
                <Select placeholder="Select access level" suffixIcon={<FeatherIcon icon="chevron-down" size={16} />}>
                  <Option value="Customer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FeatherIcon icon="user" size={14} style={{ color: '#13c2c2' }} />
                      <span>Customer - Basic customer access</span>
                    </div>
                  </Option>
                  <Option value="Staff">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FeatherIcon icon="briefcase" size={14} style={{ color: '#1890ff' }} />
                      <span>Staff - Operational access</span>
                    </div>
                  </Option>
                  <Option value="Admin">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FeatherIcon icon="shield" size={14} style={{ color: '#ff4d4f' }} />
                      <span>Admin - Full access to all features</span>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item name="isActive" label="Account Status" valuePropName="checked">
                <Switch
                  checkedChildren={
                    <span>
                      <FeatherIcon icon="check" size={12} /> Active
                    </span>
                  }
                  unCheckedChildren={
                    <span>
                      <FeatherIcon icon="x" size={12} /> Inactive
                    </span>
                  }
                />
              </Form.Item>
            </div>

            {/* Help Section */}
            <div
              style={{
                padding: '12px 16px',
                background: '#f6f8fa',
                borderRadius: '6px',
                border: '1px solid #e1e4e8',
                marginTop: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <FeatherIcon icon="info" size={16} style={{ color: '#0366d6', marginRight: '8px' }} />
                <span style={{ fontWeight: '500', color: '#0366d6' }}>User Creation Guidelines</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#586069', fontSize: '13px' }}>
                <li>Full name is required and can only contain letters and spaces</li>
                <li>Username must be unique and contain only letters, numbers, hyphens and underscores</li>
                <li>Use a valid and unique email address for each user</li>
                <li>Phone number is required for user profile and support workflows</li>
                <li>
                  <strong>Access Levels:</strong>
                  <ul style={{ marginTop: '4px' }}>
                    <li>Customer - Basic customer access</li>
                    <li>Staff - Standard operational access</li>
                    <li>Admin - Full system access and administrative privileges</li>
                  </ul>
                </li>
                <li>Set account to Active to allow immediate login</li>
              </ul>
            </div>
          </Form>
        </BasicFormWrapper>
      </div>
    </Modal>
  );
}

CreateUser.propTypes = {
  visible: propTypes.bool.isRequired,
  onCancel: propTypes.func.isRequired,
  onSuccess: propTypes.func,
};

export default CreateUser;
