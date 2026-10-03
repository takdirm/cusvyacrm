import React, { useState, useEffect } from 'react';
import { Form, Input, Switch, message } from 'antd';
import { useDispatch } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import propTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { axiosDataUpdate } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';

function UpdateDevice({ visible, onCancel, DeviceData }) {
  const dispatch = useDispatch();
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

  // Populate form with existing Device data when modal opens
  useEffect(() => {
    if (visible && DeviceData) {
      form.setFieldsValue({
        computerName: DeviceData.computerName || '',
        ipAddress: DeviceData.ipAddress || '',
        uid: DeviceData.uid || '',
        macAddress: DeviceData.macAddress || '',
        isOnline: DeviceData.isOnline || false,
      });
    }
  }, [visible, DeviceData, form]);

  const handleOk = async (values) => {
    try {
      setState((prevState) => ({ ...prevState, isSubmitting: true }));

      // Create Device DTO with the form values
      const DeviceDto = {
        computerName: values.computerName,
        ipAddress: values.ipAddress,
        uid: values.uid,
        macAddress: values.macAddress,
        isOnline: values.isOnline || false,
      };

      // Dispatch the update action
      await dispatch(axiosDataUpdate(API.device.path, DeviceData.id, DeviceDto));

      message.success('Device updated successfully!');

      // Reset form and close modal
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Error updating Device:', error);
      message.error('Failed to update Device. Please try again.');
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
      title={`Update Device: ${DeviceData?.computerName || 'Device'}`}
      visible={state.visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" key="back" outlined onClick={handleCancel} disabled={state.isSubmitting}>
            Cancel
          </Button>
          <Button size="default" type="primary" key="submit" onClick={handleSubmit} loading={state.isSubmitting}>
            {state.isSubmitting ? 'Updating...' : 'Update Device'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={600}
    >
      <div className="project-modal">
        <BasicFormWrapper>
          <Form layout="vertical" form={form} name="updateDevice" onFinish={handleOk} disabled={state.isSubmitting}>
            {/* Device Information */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Device Information</h4>

              <Form.Item
                name="computerName"
                label="Computer Name"
                rules={[
                  { required: true, message: 'Please enter computer name!' },
                  { min: 2, message: 'Computer name must be at least 2 characters!' },
                  { max: 100, message: 'Computer name cannot exceed 100 characters!' },
                ]}
              >
                <Input placeholder="Enter computer name" prefix={<FeatherIcon icon="monitor" size={16} />} />
              </Form.Item>

              <Form.Item
                name="uid"
                label="Unique Identifier (UID)"
                rules={[
                  { required: true, message: 'Please enter device UID!' },
                  { min: 3, message: 'UID must be at least 3 characters!' },
                  { max: 50, message: 'UID cannot exceed 50 characters!' },
                ]}
              >
                <Input placeholder="Enter unique device identifier" prefix={<FeatherIcon icon="hash" size={16} />} />
              </Form.Item>
            </div>

            {/* Network Information */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Network Information</h4>

              <Form.Item
                name="ipAddress"
                label="IP Address"
                rules={[
                  { required: true, message: 'Please enter IP address!' },
                  {
                    pattern:
                      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                    message: 'Please enter a valid IP address!',
                  },
                ]}
              >
                <Input placeholder="192.168.1.100" prefix={<FeatherIcon icon="globe" size={16} />} />
              </Form.Item>

              <Form.Item
                name="macAddress"
                label="MAC Address"
                rules={[
                  { required: true, message: 'Please enter MAC address!' },
                  {
                    pattern: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                    message: 'Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7)!',
                  },
                ]}
              >
                <Input placeholder="00:1B:44:11:3A:B7" prefix={<FeatherIcon icon="wifi" size={16} />} />
              </Form.Item>
            </div>

            {/* Status Information */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>Status</h4>

              <Form.Item name="isOnline" label="Online Status" valuePropName="checked">
                <Switch
                  checkedChildren={<FeatherIcon icon="wifi" size={14} />}
                  unCheckedChildren={<FeatherIcon icon="wifi-off" size={14} />}
                />
              </Form.Item>
            </div>

            <div
              style={{
                padding: '12px 16px',
                background: '#fff7e6',
                borderRadius: '6px',
                border: '1px solid #ffd591',
                marginTop: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <FeatherIcon icon="edit-3" size={16} style={{ color: '#fa8c16', marginRight: '8px' }} />
                <span style={{ fontWeight: '500', color: '#fa8c16' }}>Update Device Information</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#8c6e0a', fontSize: '13px' }}>
                <li>Modify any field to update the device information</li>
                <li>Ensure computer name and UID remain unique</li>
                <li>Update network information when device location changes</li>
                <li>Online status reflects current device availability</li>
                <li>Changes will be saved immediately after clicking Update</li>
              </ul>
            </div>
          </Form>
        </BasicFormWrapper>
      </div>
    </Modal>
  );
}

UpdateDevice.propTypes = {
  visible: propTypes.bool.isRequired,
  onCancel: propTypes.func.isRequired,
  DeviceData: propTypes.object,
};

UpdateDevice.defaultProps = {
  DeviceData: null,
};

export default UpdateDevice;
