import React, { useState, useEffect } from 'react';
import { Form, message, Select, DatePicker } from 'antd';
import { useDispatch } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import propTypes from 'prop-types';
import moment from 'moment';
import { Button } from '../../../components/buttons/buttons';
import { Modal } from '../../../components/modals/antd-modals';
import { BasicFormWrapper } from '../../styled';
import { axiosDataUpdate } from '../../../redux/axiomservice/actionCreator';
import { API } from '../../../config/api/index';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';

function UpdateBooking({ visible, onCancel, bookingData, getData }) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    visible,
    modalType: 'primary',
    isSubmitting: false,
    artists: [],
    loadingArtists: false,
  });

  let searchTimeout = null;

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
        artistId: bookingData.artistId,
        scheduledTime: bookingData.scheduledTime ? moment(bookingData.scheduledTime) : null,
      });
      // Load initial artist if exists
      if (bookingData.artistName) {
        setState((prev) => ({
          ...prev,
          artists: [{ id: bookingData.artistId, name: bookingData.artistName }],
        }));
      }
    }
  }, [bookingData, form]);

  // Search artists
  const handleArtistSearch = async (searchTerm) => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (!searchTerm || searchTerm.length < 2) {
      // Keep current artist in list if exists
      if (bookingData?.artistName) {
        setState((prev) => ({
          ...prev,
          artists: [{ id: bookingData.artistId, name: bookingData.artistName }],
        }));
      } else {
        setState((prev) => ({ ...prev, artists: [] }));
      }
      return;
    }

    searchTimeout = setTimeout(async () => {
      setState((prev) => ({ ...prev, loadingArtists: true }));
      try {
        const token = getItem('access_token');
        let apiUrl =
          window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
        if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
        const response = await axios.get(`${apiUrl}/api${API.artist.path}/search/${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setState((prev) => ({
          ...prev,
          artists: response.data || [],
          loadingArtists: false,
        }));
      } catch (error) {
        console.error('Error searching artists:', error);
        setState((prev) => ({ ...prev, loadingArtists: false, artists: [] }));
      }
    }, 500);
  };

  const handleOk = async (values) => {
    try {
      setState((prevState) => ({ ...prevState, isSubmitting: true }));

      // Create Booking DTO with the form values (only updatable fields)
      const bookingDto = {
        id: bookingData.id,
        customerId: bookingData.customerId,
        addressId: bookingData.addressId,
        promotionId: bookingData.promotionId || 0,
        status: bookingData.status,
        paymentType: bookingData.paymentType,
        taxAmount: bookingData.taxAmount || 0,
        totalPrice: bookingData.totalPrice || 0,
        artistId: values.artistId,
        scheduledTime: values.scheduledTime ? values.scheduledTime.toISOString() : null,
        paymentId: bookingData.paymentId || 0,
      };

      // Dispatch the update action with booking ID
      await dispatch(axiosDataUpdate(API.booking.path, bookingData.id, bookingDto));

      message.success('Booking updated successfully!');

      // Refresh data and close modal
      if (getData) {
        await getData();
      }
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Error updating Booking:', error);
      message.error('Failed to update Booking. Please try again.');
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
      title="Update Booking"
      visible={state.visible}
      footer={[
        <div key="1" className="project-modal-footer">
          <Button size="default" type="white" key="back" outlined onClick={handleCancel} disabled={state.isSubmitting}>
            Cancel
          </Button>
          <Button size="default" type="primary" key="submit" onClick={handleSubmit} loading={state.isSubmitting}>
            {state.isSubmitting ? 'Updating...' : 'Update Booking'}
          </Button>
        </div>,
      ]}
      onCancel={handleCancel}
      width={700}
    >
      <BasicFormWrapper>
        <Form form={form} name="updateBooking" layout="vertical">
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: '12px' }}>
              <strong>Reference:</strong> {bookingData?.referenceNumber || 'N/A'}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#8c8c8c', fontSize: '12px' }}>
              <strong>Customer:</strong> {bookingData?.customerName || 'N/A'}
            </p>
          </div>

          <Form.Item
            name="artistId"
            label="Artist"
            rules={[
              {
                required: true,
                message: 'Please select an artist!',
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Type to search artist (min 2 characters)"
              loading={state.loadingArtists}
              onSearch={handleArtistSearch}
              filterOption={false}
              notFoundContent={state.loadingArtists ? 'Searching...' : 'Type to search'}
            >
              {state.artists.map((artist) => (
                <Select.Option key={artist.id} value={artist.id}>
                  {artist.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="scheduledTime"
            label="Scheduled Time"
            rules={[
              {
                required: true,
                message: 'Please select scheduled time!',
              },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="Select date and time"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < moment().startOf('day')}
            />
          </Form.Item>
        </Form>
      </BasicFormWrapper>
    </Modal>
  );
}

UpdateBooking.propTypes = {
  visible: propTypes.bool.isRequired,
  onCancel: propTypes.func.isRequired,
  bookingData: propTypes.object.isRequired,
  getData: propTypes.func.isRequired,
};

export default UpdateBooking;
