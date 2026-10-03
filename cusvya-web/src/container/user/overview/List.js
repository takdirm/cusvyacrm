import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Modal, App, Dropdown, Form, Input } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import PropTypes from 'prop-types';
import { UserTableStyleWrapper } from '../style';
import { TableWrapper } from '../../styled';
import Heading from '../../../components/heading/heading';
import { Button } from '../../../components/buttons/buttons';
import { Cards } from '../../../components/cards/frame/cards-frame';

import { axiosDataDelete } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import { DataService } from '../../../config/dataService/dataService';

function UserListTable({ onEdit, filterStatus, getData, current, pageSize, onShowSizeChange, onHandleChange }) {
  const dispatch = useDispatch();
  const { message } = App.useApp();

  // Get user data from Redux store
  const { users, isLoading, error, totalCount } = useSelector((state) => {
    return {
      users: state.Service?.data?.items ? state.Service.data.items : [],
      isLoading: state.Service?.loading || false,
      error: state.Service?.error || null,
      totalCount: state.Service?.data?.totalCount || 0,
    };
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [setPasswordVisible, setSetPasswordVisible] = useState(false);
  const [setPasswordSubmitting, setSetPasswordSubmitting] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [setPasswordForm] = Form.useForm();

  const normalizeLevel = (level) => {
    if (level === null || level === undefined) return null;

    // Handle numeric values and numeric strings from API payloads.
    const asNumber = Number(level);
    if (!Number.isNaN(asNumber)) return asNumber;

    // Handle enum-name strings from backend (case-insensitive).
    const normalized = String(level).trim().toLowerCase();
    if (normalized === 'customer') return 0;
    if (normalized === 'staff') return 1;
    if (normalized === 'admin') return 2;

    return null;
  };

  // Get level label from enum value
  const getLevelLabel = (level) => {
    const normalizedLevel = normalizeLevel(level);
    const levelLabels = {
      0: 'Customer',
      1: 'Staff',
      2: 'Admin',
    };
    return levelLabels[normalizedLevel] || 'Unknown';
  };

  // Get level color
  const getLevelColor = (level) => {
    const normalizedLevel = normalizeLevel(level);
    const levelColors = {
      0: 'cyan',
      1: 'blue',
      2: 'red',
    };
    return levelColors[normalizedLevel] || 'default';
  };

  // Handle user deletion
  const handleDelete = (id, username, name) => {
    Modal.confirm({
      title: 'Delete User',
      icon: <FeatherIcon icon="trash-2" size={20} style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>
            Are you sure you want to delete user <strong>{name || username}</strong>?
          </p>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fff2f0',
              borderRadius: '4px',
              border: '1px solid #ffccc7',
              marginTop: '12px',
            }}
          >
            <FeatherIcon icon="alert-triangle" size={14} style={{ color: '#ff4d4f', marginRight: '8px' }} />
            <strong>Warning:</strong> This action cannot be undone.
          </div>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(
            axiosDataDelete({
              path: API.user.path,
              id,
              getData: () => getData(current, pageSize, filterStatus),
            }),
          );
          message.success(`User "${name || username}" deleted successfully`);
        } catch (error) {
          console.error('Error deleting user:', error);
          message.error('Failed to delete user');
        }
      },
    });
  };

  // Handle user edit
  const handleEdit = (user) => {
    if (onEdit) {
      onEdit(user);
    }
  };

  // Handle user view
  const handleView = (user) => {
    Modal.info({
      title: 'User Details',
      width: 600,
      content: (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong>Full Name:</strong> {user.name || 'N/A'}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Username:</strong> {user.username}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Email:</strong> {user.email}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Access Level:</strong>{' '}
            <PlainLabel color={getLevelColor(user.level)}>{getLevelLabel(user.level)}</PlainLabel>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Status:</strong>{' '}
            <PlainLabel color={user.isActive ? 'success' : 'error'}>{user.isActive ? 'Active' : 'Inactive'}</PlainLabel>
          </div>
        </div>
      ),
    });
  };

  const showSetPasswordModal = (user) => {
    setSelectedUserForPassword(user);
    setSetPasswordVisible(true);
    setPasswordForm.resetFields();
  };

  const handleSetPasswordCancel = () => {
    setSetPasswordVisible(false);
    setSelectedUserForPassword(null);
    setPasswordForm.resetFields();
  };

  const handleSetPasswordSubmit = async () => {
    try {
      const values = await setPasswordForm.validateFields();
      if (!selectedUserForPassword?.id) {
        message.error('Unable to set password: missing user id.');
        return;
      }

      setSetPasswordSubmitting(true);
      await DataService.post(`${API.user.path}/${selectedUserForPassword.id}/set-password`, {
        password: values.password,
      });

      message.success(`Password updated for "${selectedUserForPassword.name || selectedUserForPassword.username}"`);
      handleSetPasswordCancel();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      const backendMessage =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Failed to set password.';
      message.error(backendMessage);
    } finally {
      setSetPasswordSubmitting(false);
    }
  };

  // User data source for table
  const getUserDataSource = () => {
    if (!users || !users.length) return [];

    return users.map((user) => {
      const { id, name, username, email, level, isActive } = user;

      return {
        key: id || username,
        user: (
          <div className="user-info">
            <figure
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#5f63f2' : '#d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px',
                marginRight: '12px',
              }}
            >
              {name ? name.charAt(0).toUpperCase() : username ? username.charAt(0).toUpperCase() : 'U'}
            </figure>
            <figcaption>
              <Heading className="user-name" as="h6">
                {name || username}
              </Heading>
              <span style={{ fontSize: '12px', color: '#999' }}>{username}</span>
            </figcaption>
          </div>
        ),
        email: <span style={{ color: '#666' }}>{email}</span>,
        level: (
          <PlainLabel color={getLevelColor(level)} style={{ fontWeight: '500' }}>
            {getLevelLabel(level)}
          </PlainLabel>
        ),
        status: (
          <PlainLabel color={isActive ? 'success' : 'error'} style={{ fontWeight: '500' }}>
            {isActive ? 'Active' : 'Inactive'}
          </PlainLabel>
        ),
        action: (
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'view',
                  icon: <FeatherIcon icon="eye" size={14} />,
                  label: 'View',
                  onClick: () => handleView(user),
                },
                {
                  key: 'edit',
                  icon: <FeatherIcon icon="edit" size={14} />,
                  label: 'Edit',
                  onClick: () => handleEdit(user),
                },
                {
                  key: 'set-password',
                  icon: <FeatherIcon icon="key" size={14} />,
                  label: 'Set Password',
                  onClick: () => showSetPasswordModal(user),
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <FeatherIcon icon="trash-2" size={14} />,
                  label: 'Delete',
                  danger: true,
                  onClick: () => handleDelete(id, username, name),
                },
              ],
            }}
          >
            <Button size="small" outlined style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <FeatherIcon icon="more-vertical" size={14} />
              Actions
            </Button>
          </Dropdown>
        ),
      };
    });
  };

  // User table columns
  const getUserColumns = () => [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: '30%',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '25%',
    },
    {
      title: 'Access Level',
      dataIndex: 'level',
      key: 'level',
      width: '15%',
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      align: 'center',
    },
    {
      title: 'Actions',
      dataIndex: 'action',
      key: 'action',
      width: '18%',
      align: 'center',
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      name: record.key,
    }),
  };

  return (
    <Cards headless>
      <UserTableStyleWrapper>
        <TableWrapper className="table-responsive">
          <Table
            rowSelection={rowSelection}
            dataSource={getUserDataSource()}
            columns={getUserColumns()}
            loading={isLoading}
            pagination={{
              current: current,
              pageSize: pageSize,
              total: totalCount,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: onHandleChange,
              onShowSizeChange: onShowSizeChange,
            }}
            scroll={{ x: 'max-content' }}
          />
        </TableWrapper>

        <Modal
          title={`Set Password${selectedUserForPassword ? ` - ${selectedUserForPassword.name || selectedUserForPassword.username}` : ''}`}
          open={setPasswordVisible}
          onCancel={handleSetPasswordCancel}
          onOk={handleSetPasswordSubmit}
          okText="Set Password"
          confirmLoading={setPasswordSubmitting}
          destroyOnHidden
        >
          <Form form={setPasswordForm} layout="vertical">
            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter a password.' },
                { min: 8, message: 'Password must be at least 8 characters.' },
              ]}
            >
              <Input.Password placeholder="Enter new password" autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm the password.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match.'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Re-enter new password" autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>
      </UserTableStyleWrapper>
    </Cards>
  );
}

UserListTable.propTypes = {
  onEdit: PropTypes.func,
  filterStatus: PropTypes.string,
  getData: PropTypes.func.isRequired,
  current: PropTypes.number,
  pageSize: PropTypes.number,
  onShowSizeChange: PropTypes.func,
  onHandleChange: PropTypes.func,
};

UserListTable.defaultProps = {
  current: 1,
  pageSize: 10,
};

export default UserListTable;
