import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Form, InputNumber, Button, Card, message, Space, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { axiosDataRead } from '../../redux/axiomservice/actionCreator';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function JobSettings() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [state, setState] = useState({
    loading: false,
    saving: false,
  });

  const { loading, saving } = state;

  // Get Settings data from Redux store
  const { jobSettings, isLoading } = useSelector((state) => {
    return {
      jobSettings: state.Service?.data ? state.Service.data : null,
      isLoading: state.Service?.loading || false,
    };
  });

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // Build query parameters based on filter type
      const endpoint = `${API.setting.path}/${API.setting.job}`;
      await dispatch(axiosDataRead(endpoint));
    } catch (error) {
      console.error('Error fetching job settings:', error);
      message.error('Failed to fetch job settings');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    getData();
  }, []);

  // Populate form when jobSettings data is available
  useEffect(() => {
    if (jobSettings) {
      form.setFieldsValue({
        fileTransferJobsPerBatch: jobSettings.fileTransferJobsPerBatch || 50,
        scriptExecutionJobsPerBatch: jobSettings.scriptExecutionJobsPerBatch || 20,
        pollingIntervalSeconds: jobSettings.pollingIntervalSeconds || 15,
      });
    }
  }, [jobSettings, form]);

  // Handle form submission
  const handleSave = async (values) => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      console.log('Saving job settings:', values);

      const settingsDto = {
        fileTransferJobsPerBatch: values.fileTransferJobsPerBatch,
        scriptExecutionJobsPerBatch: values.scriptExecutionJobsPerBatch,
        pollingIntervalSeconds: values.pollingIntervalSeconds,
      };

      const response = await DataService.post(`${API.setting.path}/${API.setting.job}`, settingsDto, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Save Response:', response);

      message.success('Job settings saved successfully!');

      // Refresh the data after successful save
      await getData();
    } catch (error) {
      console.error('Error saving job settings:', error);

      // Handle different error response formats
      let errorMessage = 'Failed to save job settings. Please try again.';

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
    if (jobSettings) {
      form.setFieldsValue({
        fileTransferJobsPerBatch: jobSettings.fileTransferJobsPerBatch || 50,
        scriptExecutionJobsPerBatch: jobSettings.scriptExecutionJobsPerBatch || 20,
        pollingIntervalSeconds: jobSettings.pollingIntervalSeconds || 15,
      });
      message.info('Form reset to saved values');
    }
  };

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading job settings..." />
      </div>
    );
  }

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Job Settings"
          subTitle="Configure job processing parameters"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>Adjust job batch sizes and polling intervals</span>
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
                    <FeatherIcon icon="settings" size={20} />
                    Job Configuration
                  </div>
                }
                style={{ marginBottom: '20px' }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSave}
                  initialValues={{
                    fileTransferJobsPerBatch: 50,
                    scriptExecutionJobsPerBatch: 20,
                    pollingIntervalSeconds: 15,
                  }}
                >
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="fileTransferJobsPerBatch"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="upload-cloud" size={16} />
                            <span>File Transfer Jobs Per Batch</span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter file transfer jobs per batch' },
                          { type: 'number', min: 1, max: 1000, message: 'Value must be between 1 and 1000' },
                        ]}
                        tooltip="Number of file transfer jobs processed in each batch"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={1000}
                          placeholder="Enter batch size"
                          prefix={<FeatherIcon icon="hash" size={14} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="scriptExecutionJobsPerBatch"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="code" size={16} />
                            <span>Script Execution Jobs Per Batch</span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter script execution jobs per batch' },
                          { type: 'number', min: 1, max: 1000, message: 'Value must be between 1 and 1000' },
                        ]}
                        tooltip="Number of script execution jobs processed in each batch"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={1000}
                          placeholder="Enter batch size"
                          prefix={<FeatherIcon icon="hash" size={14} />}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="pollingIntervalSeconds"
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="clock" size={16} />
                            <span>Polling Interval (Seconds)</span>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Please enter polling interval' },
                          { type: 'number', min: 1, max: 300, message: 'Value must be between 1 and 300' },
                        ]}
                        tooltip="Time interval in seconds between job polling cycles"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={300}
                          placeholder="Enter interval in seconds"
                          prefix={<FeatherIcon icon="hash" size={14} />}
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
                    <strong>File Transfer Jobs Per Batch:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Controls how many file transfer jobs are processed simultaneously in each batch cycle. Higher
                      values increase throughput but may consume more system resources.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Script Execution Jobs Per Batch:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Determines the number of script execution jobs processed together. Adjust based on script
                      complexity and system capacity.
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Polling Interval:</strong>
                    <p style={{ marginTop: '4px', color: '#666' }}>
                      Time between job queue checks. Lower values provide faster job pickup but increase system load.
                      Higher values reduce load but may delay job processing.
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
                    <strong>Note:</strong> Changes take effect after the next polling cycle. Monitor system performance
                    after adjusting these values.
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

export default JobSettings;
