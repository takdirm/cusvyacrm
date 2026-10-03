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

function RemoteSettings() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    loading: false,
    saving: false,
  });

  const { loading, saving } = state;

  // Get Settings data from Redux store
  const { remoteSettings, isLoading, error } = useSelector((state) => {
    return {
      remoteSettings: state.Service?.data ? state.Service.data : null,
      isLoading: state.Service?.loading || false,
      error: state.Service?.error || null,
    };
  });

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const endpoint = `${API.setting.path}/${API.setting.remote}`;
      await dispatch(axiosDataRead(endpoint));
    } catch (error) {
      console.error('Error fetching remote settings:', error);
      message.error('Failed to fetch remote settings');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    getData();
  }, []);

  // Populate form when remoteSettings data is available
  useEffect(() => {
    if (remoteSettings) {
      form.setFieldsValue({
        enablePsExecution: remoteSettings.enablePsExecution || false,
        enableSshExecution: remoteSettings.enableSshExecution || false,
        enablePowerShell: remoteSettings.enablePowerShell || false,
        remoteSharePath: remoteSettings.remoteSharePath || '',
        psExecFilePath: remoteSettings.psExecFilePath || '',
      });
    }
  }, [remoteSettings, form]);

  // Custom validator to ensure exactly one option is selected
  const validateExactlyOne = () => {
    const values = form.getFieldsValue();
    const { enablePsExecution, enableSshExecution, enablePowerShell } = values;

    const enabledCount = [enablePsExecution, enableSshExecution, enablePowerShell].filter(Boolean).length;

    if (enabledCount === 0) {
      return Promise.reject(new Error('Exactly one execution method must be enabled'));
    }

    if (enabledCount > 1) {
      return Promise.reject(new Error('Only one execution method can be enabled at a time'));
    }

    return Promise.resolve();
  };

  // Handle checkbox change to ensure only one is selected at a time
  const handleCheckboxChange = (fieldName) => (e) => {
    const checked = e.target.checked;

    if (checked) {
      // If checking this box, uncheck all others
      const updates = {
        enablePsExecution: false,
        enableSshExecution: false,
        enablePowerShell: false,
        [fieldName]: true,
      };
      form.setFieldsValue(updates);
    }
  };

  // Handle form submission
  const handleSave = async (values) => {
    try {
      // Validate exactly one is selected
      const { enablePsExecution, enableSshExecution, enablePowerShell } = values;
      const enabledCount = [enablePsExecution, enableSshExecution, enablePowerShell].filter(Boolean).length;

      if (enabledCount === 0) {
        message.error('Exactly one execution method must be enabled');
        return;
      }

      if (enabledCount > 1) {
        message.error('Only one execution method can be enabled at a time');
        return;
      }

      setState((prev) => ({ ...prev, saving: true }));

      console.log('Saving remote settings:', values);

      const remoteSettingsDto = {
        enablePsExecution: values.enablePsExecution || false,
        enableSshExecution: values.enableSshExecution || false,
        enablePowerShell: values.enablePowerShell || false,
        remoteSharePath: values.remoteSharePath || '',
        psExecFilePath: values.psExecFilePath || '',
      };

      const response = await DataService.post(`${API.setting.path}/${API.setting.remote}`, remoteSettingsDto, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Save Response:', response);

      message.success('Remote settings saved successfully!');

      // Refresh the data after successful save
      await getData();
    } catch (error) {
      console.error('Error saving remote settings:', error);

      // Handle different error response formats
      let errorMessage = 'Failed to save remote settings. Please try again.';

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
    if (remoteSettings) {
      form.setFieldsValue({
        enablePsExecution: remoteSettings.enablePsExecution || false,
        enableSshExecution: remoteSettings.enableSshExecution || false,
        enablePowerShell: remoteSettings.enablePowerShell || false,
        remoteSharePath: remoteSettings.remoteSharePath || '',
        psExecFilePath: remoteSettings.psExecFilePath || '',
      });
      message.info('Form reset to saved values');
    }
  };

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading remote settings..." />
      </div>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Remote Execution Settings"
          subTitle="Configure remote execution methods"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>Select one remote execution method</span>
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
                    <FeatherIcon icon="server" size={20} />
                    Remote Execution Configuration
                  </div>
                }
                style={{ marginBottom: '20px' }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={{
                    enablePsExecution: false,
                    enableSshExecution: false,
                    enablePowerShell: false,
                    remoteSharePath: '',
                    psExecFilePath: '',
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#e6f7ff',
                      borderRadius: '4px',
                      border: '1px solid #91d5ff',
                      marginBottom: '20px',
                    }}
                  >
                    <FeatherIcon icon="info" size={14} style={{ color: '#1890ff', marginRight: '4px' }} />
                    <strong>Note:</strong> Only one execution method can be enabled at a time.
                  </div>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="enablePsExecution"
                        valuePropName="checked"
                        rules={[{ validator: validateExactlyOne }]}
                      >
                        <Checkbox onChange={handleCheckboxChange('enablePsExecution')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="terminal" size={16} />
                            <span style={{ fontWeight: '500' }}>Enable PsExec Execution</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginLeft: '24px', marginTop: '4px' }}>
                            Execute commands remotely using PsExec tool
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="enableSshExecution"
                        valuePropName="checked"
                        rules={[{ validator: validateExactlyOne }]}
                      >
                        <Checkbox onChange={handleCheckboxChange('enableSshExecution')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="cloud" size={16} />
                            <span style={{ fontWeight: '500' }}>Enable SSH Execution</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginLeft: '24px', marginTop: '4px' }}>
                            Execute commands via SSH protocol
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="enablePowerShell"
                        valuePropName="checked"
                        rules={[{ validator: validateExactlyOne }]}
                      >
                        <Checkbox onChange={handleCheckboxChange('enablePowerShell')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="code" size={16} />
                            <span style={{ fontWeight: '500' }}>Enable PowerShell Remoting</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginLeft: '24px', marginTop: '4px' }}>
                            Execute commands using PowerShell remoting (WinRM)
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Remote Share Directory Field */}
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="remoteSharePath"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="folder" size={16} />
                            <span>
                              <span style={{ color: 'red' }}>*</span> Remote Share Directory
                            </span>
                          </div>
                        }
                        rules={[{ required: true, message: 'Please enter remote share directory' }]}
                        tooltip="Network share directory path for remote file operations"
                      >
                        <Input
                          placeholder="\\server\share\folder"
                          prefix={<FeatherIcon icon="folder" size={16} />}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* PsExec File Path Field */}
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="psExecFilePath"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="file" size={16} />
                            <span>
                              <span style={{ color: 'red' }}>*</span> PsExec File Path
                            </span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter PsExec file path' },
                          {
                            pattern: /^[a-zA-Z]:\\.*\\PsExec(64)?\.exe$/i,
                            message: 'Please enter a valid file path ending with PsExec.exe or PsExec64.exe',
                          },
                        ]}
                        tooltip="Full path to the PsExec.exe executable file"
                      >
                        <Input
                          placeholder="C:\Tools\PsExec.exe"
                          prefix={<FeatherIcon icon="file" size={16} />}
                          size="large"
                        />
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
                    <strong>PsExec Execution:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Uses Microsoft's PsExec utility for remote command execution on Windows systems. Requires
                      administrative privileges and proper firewall configuration.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>SSH Execution:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Executes commands via Secure Shell (SSH) protocol. Ideal for Linux/Unix systems and Windows
                      systems with OpenSSH enabled. Requires SSH server to be running on target machines.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>PowerShell Remoting:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Uses Windows Remote Management (WinRM) for PowerShell remoting. Provides native Windows
                      integration and supports advanced PowerShell features. Requires WinRM to be enabled on target
                      machines.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Remote Share Directory:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Network share directory path used for file transfer and remote operations. Ensure the service
                      account has appropriate read/write permissions to this directory.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>PsExec File Path:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Full path to the PsExec.exe executable file on the local system. This tool is used for remote
                      command execution when PsExec execution method is enabled. Download from Microsoft Sysinternals if
                      not already available.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#fff7e6',
                      borderRadius: '4px',
                      border: '1px solid #ffd591',
                      marginTop: '12px',
                    }}
                  >
                    <FeatherIcon icon="alert-circle" size={14} style={{ color: '#fa8c16', marginRight: '4px' }} />
                    <strong>Important:</strong> Only one execution method can be active at a time. Selecting a new
                    method will automatically disable the previous one.
                  </div>

                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#f6ffed',
                      borderRadius: '4px',
                      border: '1px solid #b7eb8f',
                      marginTop: '12px',
                    }}
                  >
                    <FeatherIcon icon="check-circle" size={14} style={{ color: '#52c41a', marginRight: '4px' }} />
                    <strong>Recommendation:</strong> Choose the method that best matches your target environment. PsExec
                    for Windows, SSH for Linux/Unix, or PowerShell for advanced Windows management.
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

export default RemoteSettings;
