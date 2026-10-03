import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Form, Input, Button, Card, message, Space, Spin, Checkbox } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { axiosDataRead } from '../../redux/axiomservice/actionCreator';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function CredentialSettings() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    loading: false,
    saving: false,
  });

  const { loading, saving } = state;

  // Get Settings data from Redux store
  const { credentialSettings, isLoading } = useSelector((state) => {
    return {
      credentialSettings: state.Service?.data ? state.Service.data : null,
      isLoading: state.Service?.loading || false,
    };
  });

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Build query parameters based on filter type
      const endpoint = `${API.setting.path}/${API.setting.credential}`;
      await dispatch(axiosDataRead(endpoint));
    } catch (error) {
      console.error('Error fetching credential settings:', error);
      message.error('Failed to fetch credential settings');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    getData();
  }, []);

  // Populate form when credentialSettings data is available
  useEffect(() => {
    if (credentialSettings) {
      form.setFieldsValue({
        userName: credentialSettings.userName || '',
        password: credentialSettings.password || '',
        isEncrypted: credentialSettings.isEncrypted || false,
      });
    }
  }, [credentialSettings, form]);

  // Handle form submission
  const handleSave = async (values) => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      console.log('Saving credential settings:', values);

      const credentialsDto = {
        userName: values.userName,
        password: values.password,
        isEncrypted: values.isEncrypted || false,
      };

      const response = await DataService.post(`${API.setting.path}/${API.setting.credential}`, credentialsDto, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Save Response:', response);

      message.success('Credential settings saved successfully!');

      // Refresh the data after successful save
      await getData();
    } catch (error) {
      console.error('Error saving credential settings:', error);

      // Handle different error response formats
      let errorMessage = 'Failed to save credential settings. Please try again.';

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.statusText) {
          errorMessage = `Error: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  // Handle form reset
  const handleReset = () => {
    if (credentialSettings) {
      form.setFieldsValue({
        userName: credentialSettings.userName || '',
        password: credentialSettings.password || '',
        isEncrypted: credentialSettings.isEncrypted || false,
      });
      message.info('Form reset to saved values');
    }
  };

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading credential settings..." />
      </div>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Credential Settings"
          subTitle="Configure system authentication credentials"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                Manage authentication credentials for system operations
              </span>
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        <Row gutter={25}>
          <Col xs={24} lg={16} xl={12}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="key" size={20} />
                    Credential Configuration
                  </div>
                }
                style={{ marginBottom: '20px' }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={{
                    userName: '',
                    password: '',
                    isEncrypted: false,
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="userName"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="user" size={16} />
                            <span>
                              <span style={{ color: 'red' }}>*</span> User Name
                            </span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter user name' },
                          { min: 3, message: 'User name must be at least 3 characters' },
                        ]}
                        tooltip="System user name for authentication"
                      >
                        <Input
                          placeholder="Enter user name"
                          prefix={<FeatherIcon icon="user" size={16} />}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="password"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="lock" size={16} />
                            <span>
                              <span style={{ color: 'red' }}>*</span> Password
                            </span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter password' },
                          { min: 6, message: 'Password must be at least 6 characters' },
                        ]}
                        tooltip="System password for authentication"
                      >
                        <Input.Password
                          placeholder="Enter password"
                          prefix={<FeatherIcon icon="lock" size={16} />}
                          size="large"
                          iconRender={(visible) =>
                            visible ? <FeatherIcon icon="eye" size={16} /> : <FeatherIcon icon="eye-off" size={16} />
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item name="isEncrypted" valuePropName="checked" tooltip="Enable password encryption">
                        <Checkbox>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="shield" size={16} />
                            <span>Enable Password Encryption</span>
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Form Actions */}
                  <Row>
                    <Col xs={24}>
                      <Form.Item style={{ marginBottom: 0, marginTop: '20px' }}>
                        <Space size="middle">
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            icon={<FeatherIcon icon="save" size={16} />}
                            size="large"
                          >
                            Save Settings
                          </Button>
                          <Button
                            type="default"
                            onClick={handleReset}
                            icon={<FeatherIcon icon="rotate-ccw" size={16} />}
                            size="large"
                            disabled={saving}
                          >
                            Reset
                          </Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Cards>
          </Col>

          {/* Info Panel */}
          <Col xs={24} lg={8} xl={12}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="help-circle" size={20} />
                    Guidelines
                  </div>
                }
              >
                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>User Name:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      The system user account name used for authenticating remote operations. This should be a valid
                      Windows domain or local user account.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Password Encryption:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      When enabled, the password will be encrypted before storage. This adds an extra layer of security
                      to protect sensitive credentials.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#fff1f0',
                      borderRadius: '4px',
                      border: '1px solid #ffccc7',
                      marginTop: '12px',
                    }}
                  >
                    <FeatherIcon icon="alert-triangle" size={14} style={{ color: '#ff4d4f', marginRight: '4px' }} />
                    <strong>Security Warning:</strong> These credentials are used for system-level operations. Ensure
                    the account has appropriate permissions and follows the principle of least privilege.
                  </div>

                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff',
                      marginTop: '12px',
                    }}
                  >
                    <FeatherIcon icon="info" size={14} style={{ color: '#1890ff', marginRight: '4px' }} />
                    <strong>Best Practice:</strong> Always enable password encryption and regularly rotate credentials
                    to maintain security.
                  </div>
                </div>
              </Card>
            </Cards>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default CredentialSettings;
