import React, { useState, useEffect } from 'react';
import { Form, message, Select } from 'antd';
import { useDispatch } from 'react-redux';
import propTypes from 'prop-types';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { API } from '../../../config/api/index';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';
import { BookingStatus } from '../bookingStatus';

function UpdateBookingStatus({ visible, onCancel, bookingData, getData }) {
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

  // Populate form when bookingData changes
  useEffect(() => {
    if (bookingData) {
      form.setFieldsValue({
        status: bookingData.status,
      });
    }
  }, [bookingData, form]);

  const handleOk = async (values) => {
    try {
      setState((prevState) => ({ ...prevState, isSubmitting: true }));

      const token = getItem('access_token');
      const apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT?.replace(/\/api\/?$/, '').replace(/\/$/, '') ||
        process.env.REACT_APP_API_ENDPOINT?.replace(/\/api\/?$/, '').replace(/\/$/, '') ||
        'http://localhost:4080';

      // Status update DTO
      const statusDto = {
        bookingId: bookingData.id,
        status: values.status,
      };

      // Call the status update endpoint
      await axios.put(`${apiUrl}${API.booking.path}/${bookingData.id}/status`, statusDto, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Booking status updated successfully!');

      // Refresh data and close modal
      if (getData) {
        await getData();
      }
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Error updating Booking status:', error);
      message.error('Failed to update Booking status. Please try again.');
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
      title="Update Booking Status"
      visible={state.visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" key="back" outlined onClick={handleCancel} disabled={state.isSubmitting}>
            Cancel
          </Button>
          <Button size="default" type="primary" key="submit" onClick={handleSubmit} loading={state.isSubmitting}>
            {state.isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={500}
    >
      <BasicFormWrapper>
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Reference:</strong> {bookingData?.referenceNumber || 'N/A'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            <strong>Customer:</strong> {bookingData?.customerName || 'N/A'}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            <strong>Artist:</strong> {bookingData?.artistName || 'N/A'}
          </p>
        </div>

        <Form form={form} name="updateBookingStatus" layout="vertical">
          <Form.Item
            name="status"
            label="Booking Status"
            rules={[
              {
                required: true,
                message: 'Please select booking status!',
              },
            ]}
          >
            <Select placeholder="Select booking status" size="large">
              {Object.keys(BookingStatus).map((key) => (
                <Select.Option key={key} value={parseInt(key)}>
                  {BookingStatus[key]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

UpdateBookingStatus.propTypes = {
  visible: propTypes.bool.isRequired,
  onCancel: propTypes.func.isRequired,
  bookingData: propTypes.object.isRequired,
  getData: propTypes.func.isRequired,
};

export default UpdateBookingStatus;
