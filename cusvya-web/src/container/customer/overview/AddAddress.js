import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, message, Spin, Alert } from 'antd';
import { Button } from '../../../components/buttons/buttons';
import { API } from '../../../config/api/index';
import axios from 'axios';
import { getItem } from '../../../utility/localStorageControl';

function AddAddress({ visible, onCancel, customerId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [placeData, setPlaceData] = useState(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Load Google Places API script
      const loadGooglePlaces = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          initializeAutocomplete();
          return;
        }

        // Check if script is already loading
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          const checkInterval = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
              clearInterval(checkInterval);
              initializeAutocomplete();
            }
          }, 100);
          return;
        }

        // Get API key from environment or config
        const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY;

        if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY') {
          setApiKeyMissing(true);
          console.warn(
            'Missing Google Places API key. Add REACT_APP_GOOGLE_PLACES_API_KEY to your .env file.\n' +
              'Get an API key from: https://console.cloud.google.com/google/maps-apis/credentials',
          );
          return;
        }

        setApiKeyMissing(false);

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Poll until places library is available
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          const checkPlaces = setInterval(() => {
            attempts++;
            if (window.google?.maps?.places) {
              clearInterval(checkPlaces);
              initializeAutocomplete();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkPlaces);
              console.error('Google Places library failed to load');
              message.error('Failed to initialize Google Places. Please refresh the page.');
            }
          }, 100);
        };
        script.onerror = () => {
          message.error('Failed to load Google Places API. Please check your API key.');
        };
        document.head.appendChild(script);
      };

      loadGooglePlaces();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [visible]);

  const initializeAutocomplete = () => {
    // Verify Google Places library is loaded
    if (!window.google?.maps?.places?.Autocomplete) {
      console.error('Google Places Autocomplete is not available');
      return;
    }

    // Access the underlying DOM input element from Ant Design Input
    const inputElement = autocompleteInputRef.current?.input || autocompleteInputRef.current;

    if (!inputElement) {
      console.warn('Input element not found for autocomplete');
      return;
    }

    try {
      // Bangalore, India coordinates and bounds
      const bangaloreBounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(12.7342, 77.3791), // Southwest corner
        new window.google.maps.LatLng(13.1737, 77.881), // Northeast corner
      );

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputElement, {
        componentRestrictions: { country: 'IN' },
        bounds: bangaloreBounds,
        strictBounds: false, // Prefer Bangalore results but allow nearby
        fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      message.error('Failed to initialize address autocomplete');
    }
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place || !place.geometry) {
      message.warning('Please select a valid address from the dropdown');
      return;
    }

    const addressComponents = place.address_components || [];
    const getComponent = (types, useShort = false) => {
      // Support both single type string and array of types
      const typeArray = Array.isArray(types) ? types : [types];
      const component = addressComponents.find((comp) => typeArray.some((type) => comp.types.includes(type)));
      return component ? (useShort ? component.short_name : component.long_name) : '';
    };

    // Build street address line
    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const premise = getComponent('premise');
    const subpremise = getComponent('subpremise');

    let line1 = '';
    if (premise || subpremise) {
      line1 = [subpremise, premise, streetNumber, route].filter(Boolean).join(', ');
    } else {
      line1 = [streetNumber, route].filter(Boolean).join(' ');
    }

    // Extract postal code with multiple fallbacks
    const postalCode =
      getComponent('postal_code') ||
      getComponent('postal_code_prefix') ||
      (place.formatted_address?.match(/\b\d{6}\b/) || [])[0] ||
      '';

    const addressData = {
      placeId: place.place_id,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      line1: line1 || getComponent(['sublocality_level_2', 'sublocality_level_3']),
      line2: getComponent(['sublocality_level_1', 'sublocality_level_2', 'neighborhood']),
      city: getComponent('locality') || getComponent('administrative_area_level_2') || 'Bangalore',
      state: getComponent('administrative_area_level_1', true) || 'KA',
      postalCode: postalCode,
      country: getComponent('country', true) || 'IN',
      formattedAddress: place.formatted_address,
    };

    console.log('Parsed address data:', addressData);
    console.log('Address components:', addressComponents);

    setPlaceData(addressData);

    // Update form fields with parsed address
    form.setFieldsValue({
      line1: addressData.line1,
      line2: addressData.line2,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
    });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const formValues = form.getFieldsValue();

      // Only require Google Places data if API key is available
      if (!placeData && !apiKeyMissing) {
        message.error('Please select an address from Google Places autocomplete');
        return;
      }

      setLoading(true);

      const payload = {
        // Include placeId and coordinates only if available from Google Places
        placeId: placeData?.placeId || null,
        latitude: placeData?.latitude || 0,
        longitude: placeData?.longitude || 0,
        line1: formValues.line1,
        line2: formValues.line2 || null,
        city: formValues.city,
        state: formValues.state,
        postalCode: formValues.postalCode,
        country: formValues.country,
        houseApartment: formValues.houseApartment || null,
        tag: formValues.tag || null,
      };

      const token = getItem('access_token');
      let apiUrl =
        window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);

      await axios.post(`${apiUrl}/api${API.customer.path}/${customerId}/address`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Address added successfully');
      form.resetFields();
      setPlaceData(null);
      onCancel();
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Error adding address:', error);
        message.error(error.response?.data?.message || 'Failed to add address');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setPlaceData(null);
    onCancel();
  };

  return (
    <Modal
      title="Add Address"
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={[
        <Button key="cancel" type="white" outlined onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spin size="small" /> : 'Add Address'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {apiKeyMissing && (
          <Alert
            message="Google Places API Key Required"
            description={
              <div>
                <p>The Google Places API key is not configured. To enable address autocomplete, please:</p>
                <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  <li>
                    Get an API key from{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Enable the "Places API" for your project</li>
                  <li>
                    Add <code>REACT_APP_GOOGLE_PLACES_API_KEY=your_key_here</code> to your <code>.env</code> file
                  </li>
                  <li>Restart the development server</li>
                </ol>
                <p style={{ marginTop: '8px', marginBottom: 0 }}>
                  <strong>Note:</strong> You can still manually enter address details below.
                </p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {!apiKeyMissing && (
          <Form.Item label="Search Address" required>
            <Input
              ref={autocompleteInputRef}
              placeholder="Start typing to search for an address..."
              style={{ marginBottom: '8px' }}
            />
            <small style={{ color: '#8c8c8c' }}>
              Search and select an address from Google Places. The address components will be auto-filled below.
            </small>
          </Form.Item>
        )}

        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#262626' }}>
            Address Details{' '}
            {!placeData && !apiKeyMissing && <span style={{ color: '#ff4d4f' }}>(Select address above)</span>}
          </h4>

          <Form.Item
            label="Address Line 1"
            name="line1"
            rules={[{ required: true, message: 'Address Line 1 is required' }]}
          >
            <Input
              placeholder="Street address"
              disabled={!apiKeyMissing && !placeData}
              style={{ backgroundColor: '#fff' }}
            />
          </Form.Item>

          <Form.Item label="Address Line 2" name="line2">
            <Input
              placeholder="Apartment, suite, etc. (optional)"
              disabled={!apiKeyMissing && !placeData}
              style={{ backgroundColor: '#fff' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: 'City is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="City" disabled={!apiKeyMissing && !placeData} style={{ backgroundColor: '#fff' }} />
            </Form.Item>

            <Form.Item
              label="State"
              name="state"
              rules={[{ required: true, message: 'State is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="State" disabled={!apiKeyMissing && !placeData} style={{ backgroundColor: '#fff' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              label="Postal Code"
              name="postalCode"
              rules={[{ required: true, message: 'Postal code is required' }]}
              style={{ flex: 1 }}
            >
              <Input
                placeholder="Postal code"
                disabled={!apiKeyMissing && !placeData}
                style={{ backgroundColor: '#fff' }}
              />
            </Form.Item>

            <Form.Item
              label="Country"
              name="country"
              rules={[{ required: true, message: 'Country is required' }]}
              style={{ flex: 1 }}
            >
              <Input
                placeholder="Country"
                disabled={!apiKeyMissing && !placeData}
                style={{ backgroundColor: '#fff' }}
              />
            </Form.Item>
          </div>
        </div>

        <Form.Item label="House/Apartment/Suite" name="houseApartment">
          <Input placeholder="e.g., Apt 4B, House #12" />
        </Form.Item>

        <Form.Item label="Address Tag" name="tag">
          <Input placeholder="e.g., Home, Office, Studio" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddAddress;
