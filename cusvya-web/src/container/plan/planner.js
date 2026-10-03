import React, { useState } from 'react';
import { Row, Col, Form, Input, Select, Button, Card, message, Space, AutoComplete, Checkbox, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { getScriptTypeText, scriptType, releaseType, getReleaseTypeText } from '../../config/enum/enum';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

function Planner() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: false,
    selectedReleaseType: null,
    selectedScriptType: null,
    commandNameOptions: [],
    isAllComputers: false,
    selectedPlanId: null,
  });

  const { loading, selectedReleaseType, selectedScriptType, commandNameOptions, isAllComputers, selectedPlanId } =
    state;

  const searchableCommandName = async (commandName) => {
    try {
      const response = await DataService.get(`${API.Planner.path}/searchable-plan?commandname=${commandName}`);

      // Handle different response formats
      let commandList = [];

      if (Array.isArray(response)) {
        // If response is directly an array
        commandList = response;
      } else if (response && Array.isArray(response.data)) {
        // If response has a data property that contains the array
        commandList = response.data;
      } else if (response && Array.isArray(response.items)) {
        // If response has an items property that contains the array
        commandList = response.items;
      } else {
        console.warn('Unexpected response format from searchable-plan:', response);
        commandList = [];
      }

      // Store the full plan objects for later use
      setState((prevState) => ({
        ...prevState,
        commandNameOptions: commandList.map((plan) => ({
          value: plan.commandName,
          label: plan.commandName,
          plan, // Store the entire plan object (property shorthand)
        })),
      }));
    } catch (error) {
      console.error('Error fetching command names:', error);
      setState((prevState) => ({
        ...prevState,
        commandNameOptions: [],
      }));
    }
  };

  // Handle command name selection
  const handleCommandNameSelect = (value, option) => {
    if (option && option.plan) {
      const { plan: selectedPlan } = option; // Object destructuring

      // Populate form with selected plan data
      form.setFieldsValue({
        commandName: selectedPlan.commandName,
        computerNames: selectedPlan.computerNames || '',
        releaseType: selectedPlan.releaseType,
        scriptType: selectedPlan.scriptType,
        scriptContent: selectedPlan.scriptContent || '',
        filePath: selectedPlan.filePath || '',
        isAllComputers: selectedPlan.isAllComputers || false,
        pinToDashboard: selectedPlan.pinToDashboard || false,
      });

      // Update state with selected plan details
      setState((prev) => ({
        ...prev,
        selectedReleaseType: selectedPlan.releaseType,
        selectedScriptType: selectedPlan.scriptType,
        isAllComputers: selectedPlan.isAllComputers || false,
        selectedPlanId: selectedPlan.id,
      }));

      message.success(`Plan "${selectedPlan.commandName}" loaded successfully!`);
    }
  };

  // Handle IsAllComputers checkbox change
  const handleIsAllComputersChange = (e) => {
    const { checked } = e.target; // Object destructuring
    setState((prev) => ({ ...prev, isAllComputers: checked }));

    // Clear computer names when "All Computers" is selected
    if (checked) {
      form.setFieldsValue({
        computerNames: '',
      });
    }
  };

  // Handle PinToDashboard checkbox change
  const handlePinToDashboardChange = (e) => {
    const { checked } = e.target; // Object destructuring
    // We don't need to store this in state as it's handled by form
    form.setFieldsValue({
      pinToDashboard: checked,
    });
  };

  // Handle form submission
  const handleTrigger = async (values) => {
    // Get command name for confirmation message
    const commandName = values.commandName || 'Unknown';
    const computerCount = values.isAllComputers
      ? 'all computers'
      : values.computerNames
        ? values.computerNames.split(/[\n,]+/).filter((name) => name.trim()).length
        : 0;

    confirm({
      title: 'Trigger Plan',
      icon: <FeatherIcon icon="alert-circle" size={20} style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <p>Are you sure you want to trigger this plan?</p>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Command Name:</strong> {commandName}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Release Type:</strong> {getReleaseTypeText(values.releaseType)}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Script Type:</strong> {getScriptTypeText(values.scriptType)}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Target:</strong> {values.isAllComputers ? 'All Computers' : `${computerCount} computer(s)`}
            </p>
            {values.pinToDashboard && (
              <p style={{ margin: '4px 0', color: '#1890ff' }}>
                <FeatherIcon icon="bookmark" size={14} style={{ marginRight: '4px' }} />
                <strong>This plan will be pinned to dashboard</strong>
              </p>
            )}
          </div>
          <p style={{ marginTop: '12px', color: '#faad14' }}>
            <FeatherIcon icon="info" size={14} style={{ marginRight: '4px' }} />
            The plan will be executed immediately on the target computers.
          </p>
        </div>
      ),
      okText: 'Trigger Plan',
      okType: 'primary',
      cancelText: 'Cancel',
      width: 520,
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, loading: true }));

          console.log('Form Values:', values);

          // Create PlanDto object based on the C# class structure
          const planDto = {
            id: selectedPlanId || 0, // Include the plan ID
            commandName: values.commandName || '',
            computerNames: values.isAllComputers ? '' : values.computerNames || '',
            releaseType: values.releaseType,
            scriptType: values.scriptType || 7,
            scriptContent: values.scriptContent || '',
            filePath: values.filePath || '',
            fileName: '', // Not collected in form, can be derived from filePath or set to empty
            isAllComputers: values.isAllComputers || false,
            pinToDashboard: values.pinToDashboard || false,
          };

          console.log('PlanDto to be sent:', planDto);

          // Post the PlanDto to the trigger endpoint with headers
          const response = await DataService.post(`${API.Planner.path}/trigger`, planDto, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('API Response:', response);

          message.success('Plan triggered successfully!');

          // Optionally reset form after successful trigger
          // form.resetFields();
          // setState((prev) => ({
          //   ...prev,
          //   selectedReleaseType: null,
          //   selectedScriptType: null,
          //   isAllComputers: false,
          //   selectedPlanId: null,
          // }));
        } catch (error) {
          console.error('Error triggering plan:', error);

          // Handle different error response formats
          let errorMessage = 'Failed to trigger plan. Please try again.';

          if (error.response) {
            // Server responded with error status
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
          setState((prev) => ({ ...prev, loading: false }));
        }
      },
      onCancel() {
        console.log('Trigger cancelled');
      },
    });
  };

  const handleSavePlan = async (values) => {
    // Get command name for confirmation message
    const commandName = values.commandName || 'Unknown';
    const computerCount = values.isAllComputers
      ? 'all computers'
      : values.computerNames
        ? values.computerNames.split(/[\n,]+/).filter((name) => name.trim()).length
        : 0;

    confirm({
      title: selectedPlanId ? 'Update Plan' : 'Save Plan',
      icon: <FeatherIcon icon="save" size={20} style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <p>Are you sure you want to {selectedPlanId ? 'update' : 'save'} this plan?</p>
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ margin: '4px 0' }}>
              <strong>Command Name:</strong> {commandName}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Release Type:</strong> {getReleaseTypeText(values.releaseType)}
            </p>
            {selectedReleaseType === releaseType.execution && (
              <p style={{ margin: '4px 0' }}>
                <strong>Script Type:</strong> {getScriptTypeText(values.scriptType)}
              </p>
            )}
            <p style={{ margin: '4px 0' }}>
              <strong>Target:</strong> {values.isAllComputers ? 'All Computers' : `${computerCount} computer(s)`}
            </p>
            {values.pinToDashboard && (
              <p style={{ margin: '4px 0', color: '#1890ff' }}>
                <FeatherIcon icon="bookmark" size={14} style={{ marginRight: '4px' }} />
                <strong>This plan will be pinned to dashboard</strong>
              </p>
            )}
          </div>
          <p style={{ marginTop: '12px', color: '#52c41a' }}>
            <FeatherIcon icon="info" size={14} style={{ marginRight: '4px' }} />
            The plan will be saved for later execution. It will not run immediately.
          </p>
        </div>
      ),
      okText: selectedPlanId ? 'Update' : 'Save Plan',
      okType: 'primary',
      cancelText: 'Cancel',
      width: 520,
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, loading: true }));

          console.log('Form Values:', values);

          // Create PlanDto object based on the C# class structure
          const planDto = {
            id: selectedPlanId || 0,
            commandName: values.commandName || '',
            computerNames: values.isAllComputers ? '' : values.computerNames || '',
            releaseType: values.releaseType,
            scriptType: values.scriptType || 7,
            scriptContent: values.scriptContent || '',
            filePath: values.filePath || '',
            fileName: '',
            isAllComputers: values.isAllComputers || false,
            pinToDashboard: values.pinToDashboard || false,
          };

          console.log('PlanDto to be sent:', planDto);

          // Post the PlanDto to the trigger endpoint with headers
          const response = await DataService.post(`${API.Planner.path}`, planDto, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('API Response:', response);

          message.success(selectedPlanId ? 'Plan updated successfully!' : 'Plan saved successfully!');

          // Update the selectedPlanId if it was a new plan
          if (!selectedPlanId && response && response.id) {
            setState((prev) => ({ ...prev, selectedPlanId: response.id }));
          }
        } catch (error) {
          console.error('Error saving plan:', error);

          // Handle different error response formats
          let errorMessage = 'Failed to save plan. Please try again.';

          if (error.response) {
            // Server responded with error status
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
          setState((prev) => ({ ...prev, loading: false }));
        }
      },
      onCancel() {
        console.log('Save cancelled');
      },
    });
  };

  // Handle form cancellation
  const handleCancel = () => {
    form.resetFields();
    setState((prev) => ({
      ...prev,
      selectedReleaseType: null,
      selectedScriptType: null,
      commandNameOptions: [],
      isAllComputers: false,
      selectedPlanId: null,
    }));
    message.info('Form cleared');
  };

  // Handle plan deletion
  const handleDelete = async () => {
    if (!selectedPlanId || selectedPlanId <= 0) {
      message.warning('No plan selected to delete');
      return;
    }

    // Get the command name for the confirmation message
    const commandName = form.getFieldValue('commandName');

    confirm({
      title: 'Delete Plan',
      icon: <FeatherIcon icon="alert-triangle" size={20} style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete this plan?</p>
          {commandName && (
            <p style={{ marginTop: '8px' }}>
              <strong>Command Name:</strong> {commandName}
            </p>
          )}
          <p style={{ marginTop: '8px', color: '#ff4d4f' }}>
            <strong>Warning:</strong> This action cannot be undone.
          </p>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, loading: true }));

          const response = await DataService.delete(`${API.Planner.path}/${selectedPlanId}`, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('Delete Response:', response);

          message.success('Plan deleted successfully!');

          // Reset form and state after successful deletion
          form.resetFields();
          setState((prev) => ({
            ...prev,
            selectedReleaseType: null,
            selectedScriptType: null,
            commandNameOptions: [],
            isAllComputers: false,
            selectedPlanId: null,
          }));
        } catch (error) {
          console.error('Error deleting plan:', error);

          // Handle different error response formats
          let errorMessage = 'Failed to delete plan. Please try again.';

          if (error.response) {
            // Server responded with error status
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
          setState((prev) => ({ ...prev, loading: false }));
        }
      },
      onCancel() {
        console.log('Delete cancelled');
      },
    });
  };

  // Handle release type change
  const handleReleaseTypeChange = (value) => {
    setState((prev) => ({ ...prev, selectedReleaseType: value }));

    // Clear script type, script content and file path when release type changes
    if (value === releaseType.transfer) {
      // For transfer type, clear script-related fields
      form.setFieldsValue({
        scriptType: null,
        scriptContent: '',
        filePath: '',
      });
      setState((prev) => ({ ...prev, selectedScriptType: null }));
    } else if (value === releaseType.execution) {
      // For execution type, clear content fields but keep script type enabled
      form.setFieldsValue({
        scriptContent: '',
        filePath: '',
      });
      // Note: Don't clear scriptType here, just clear the content
    }
  };

  // Handle script type change
  const handleScriptTypeChange = (value) => {
    setState((prev) => ({ ...prev, selectedScriptType: value }));
    // Clear script content and file path when script type changes
    form.setFieldsValue({
      scriptContent: '',
      filePath: '',
    });
  };

  // Check if script content should be visible
  const shouldShowScriptContent = () => {
    if (selectedReleaseType === releaseType.execution) {
      return (
        selectedScriptType === scriptType.batchscript ||
        selectedScriptType === scriptType.powershellscript ||
        selectedScriptType === scriptType.vbscript
      );
    }
    return false;
  };

  // Check if file path should be visible
  const shouldShowFilePath = () => {
    return selectedReleaseType === releaseType.transfer;
  };

  // Get script type options
  const getScriptTypeOptions = () => {
    return Object.entries(scriptType).map(([key, value]) => (
      <Option key={key} value={value}>
        {getScriptTypeText(value)}
      </Option>
    ));
  };

  // Get release type options
  const getReleaseTypeOptions = () => {
    return Object.entries(releaseType).map(([key, value]) => (
      <Option key={key} value={value}>
        {getReleaseTypeText(value)}
      </Option>
    ));
  };

  // Handle Monitor button click
  const handleMonitor = () => {
    const commandName = form.getFieldValue('commandName');
    if (commandName) {
      navigate(`/admin/release?commandname=${encodeURIComponent(commandName)}`);
    } else {
      message.warning('Please select a command name first');
    }
  };

  return (
    <>
      <ProjectHeader>
        <PageHeader
          ghost
          title="Plan Executor"
          subTitle="Create and execute deployment plans"
          buttons={[
            <div key="info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FeatherIcon icon="info" size={16} style={{ color: '#1890ff' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>
                {selectedPlanId
                  ? `Editing Plan ID: ${selectedPlanId}`
                  : 'Fill in the required fields to create a new plan'}
              </span>
            </div>,
          ]}
        />
      </ProjectHeader>

      <Main>
        {/* Form Row - Full Width */}
        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FeatherIcon icon="settings" size={20} />
                    Plan Configuration
                    {selectedPlanId && (
                      <span style={{ fontSize: '12px', color: '#1890ff', marginLeft: '8px' }}>
                        (ID: {selectedPlanId})
                      </span>
                    )}
                  </div>
                }
                style={{ marginBottom: '20px' }}
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleTrigger}
                  initialValues={{
                    releaseType: null,
                    scriptType: null,
                    isAllComputers: false,
                    pinToDashboard: false,
                  }}
                >
                  {/* First Row - Command Name with AutoComplete */}
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="commandName"
                        label={
                          <span>
                            <span style={{ color: 'red' }}>*</span> Command Name
                          </span>
                        }
                        rules={[
                          { required: true, message: 'Please enter command name' },
                          { min: 3, message: 'Command name must be at least 3 characters' },
                        ]}
                      >
                        <AutoComplete
                          placeholder="Search or enter command name"
                          onSearch={searchableCommandName}
                          onSelect={handleCommandNameSelect}
                          options={commandNameOptions}
                          filterOption={false}
                          allowClear
                          style={{ width: '100%' }}
                        >
                          <Input
                            prefix={<FeatherIcon icon="terminal" size={16} />}
                            suffix={<FeatherIcon icon="search" size={16} style={{ color: '#999' }} />}
                          />
                        </AutoComplete>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Second Row - IsAllComputers and PinToDashboard Checkboxes */}
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="isAllComputers" valuePropName="checked">
                        <Checkbox onChange={handleIsAllComputersChange}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="globe" size={16} />
                            <span>Apply to all computers</span>
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="pinToDashboard" valuePropName="checked">
                        <Checkbox onChange={handlePinToDashboardChange}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FeatherIcon icon="bookmark" size={16} />
                            <span>Pin to Dashboard</span>
                          </div>
                        </Checkbox>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Third Row - Computer Names (TextArea) - Only visible when not isAllComputers */}
                  {!isAllComputers && (
                    <Row gutter={16}>
                      <Col xs={24}>
                        <Form.Item
                          name="computerNames"
                          label={
                            <span>
                              <span style={{ color: 'red' }}>*</span> Computer Names
                            </span>
                          }
                          rules={[{ required: !isAllComputers, message: 'Please enter computer names' }]}
                        >
                          <TextArea rows={3} placeholder="Enter computer names (one per line or comma separated)" />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  {/* Fourth Row - Release Type and Script Type */}
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="releaseType"
                        label={
                          <span>
                            <span style={{ color: 'red' }}>*</span> Release Type
                          </span>
                        }
                        rules={[{ required: true, message: 'Please select release type' }]}
                      >
                        <Select
                          placeholder="Select release type"
                          onChange={handleReleaseTypeChange}
                          suffixIcon={<FeatherIcon icon="chevron-down" size={16} />}
                        >
                          {getReleaseTypeOptions()}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        name="scriptType"
                        label={
                          <span>
                            <span style={{ color: 'red' }}>*</span> Script Type
                          </span>
                        }
                        rules={[
                          {
                            required: selectedReleaseType === releaseType.execution,
                            message: 'Please select script type',
                          },
                        ]}
                      >
                        <Select
                          placeholder={
                            selectedReleaseType === releaseType.transfer
                              ? 'Not required for Transfer type'
                              : selectedReleaseType === releaseType.execution
                                ? 'Select script type'
                                : 'Select release type first'
                          }
                          onChange={handleScriptTypeChange}
                          suffixIcon={<FeatherIcon icon="chevron-down" size={16} />}
                          disabled={selectedReleaseType === releaseType.transfer}
                        >
                          {getScriptTypeOptions()}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Script Content - Only visible for Execution type with script-based types */}
                  {shouldShowScriptContent() && (
                    <Row>
                      <Col xs={24}>
                        <Form.Item
                          name="scriptContent"
                          label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FeatherIcon icon="code" size={16} />
                              Script Content
                            </div>
                          }
                          rules={[{ required: true, message: 'Please enter script content' }]}
                        >
                          <TextArea
                            rows={8}
                            placeholder={`Enter your ${getScriptTypeText(selectedScriptType)} code here...`}
                            style={{ fontFamily: 'monospace' }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  {/* File Path - Only visible for Transfer type */}
                  {shouldShowFilePath() && (
                    <Row>
                      <Col xs={24}>
                        <Form.Item
                          name="filePath"
                          label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FeatherIcon icon="folder" size={16} />
                              File Path
                            </div>
                          }
                          rules={[{ required: true, message: 'Please enter file path' }]}
                        >
                          <TextArea rows={3} placeholder="Enter file paths (one per line)..." />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}

                  {/* Form Actions */}
                  <Row>
                    <Col xs={24}>
                      <Form.Item style={{ marginBottom: 0, marginTop: '20px' }}>
                        <Space size="middle" wrap>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            icon={<FeatherIcon icon="play" size={16} />}
                            size="large"
                          >
                            Trigger Plan
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => {
                              form
                                .validateFields()
                                .then((values) => {
                                  handleSavePlan(values);
                                })
                                .catch((errorInfo) => {
                                  message.error('Please fill in all required fields');
                                });
                            }}
                            loading={loading}
                            icon={<FeatherIcon icon="save" size={16} />}
                            size="large"
                            style={{
                              backgroundColor: '#52c41a',
                              borderColor: '#52c41a',
                              color: '#fff',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#73d13d';
                              e.currentTarget.style.borderColor = '#73d13d';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#52c41a';
                              e.currentTarget.style.borderColor = '#52c41a';
                            }}
                          >
                            {selectedPlanId ? 'Update Plan' : 'Save Plan'}
                          </Button>

                          {form.getFieldValue('commandName') && (
                            <Button
                              type="primary"
                              onClick={handleMonitor}
                              icon={<FeatherIcon icon="activity" size={16} />}
                              size="large"
                              disabled={loading}
                            >
                              Monitor
                            </Button>
                          )}
                          {selectedPlanId && (
                            <Button
                              danger
                              type="primary"
                              onClick={handleDelete}
                              icon={<FeatherIcon icon="trash-2" size={16} />}
                              size="large"
                              loading={loading}
                            >
                              Delete Plan
                            </Button>
                          )}
                          <Button
                            type="default"
                            onClick={handleCancel}
                            icon={<FeatherIcon icon="x" size={16} />}
                            size="large"
                            disabled={loading}
                            style={{
                              backgroundColor: '#8c8c8c',
                              borderColor: '#8c8c8c',
                              color: '#fff',
                            }}
                            onMouseEnter={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#595959';
                                e.currentTarget.style.borderColor = '#595959';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!loading) {
                                e.currentTarget.style.backgroundColor = '#8c8c8c';
                                e.currentTarget.style.borderColor = '#8c8c8c';
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Cards>
          </Col>
        </Row>

        {/* Guidelines Row - Separate Row */}
        <Row gutter={25}>
          <Col xs={24} lg={12} xl={8}>
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
                    <strong>Release Types:</strong>
                    <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <li>
                        <strong>Execution:</strong> Run scripts on target devices
                      </li>
                      <li>
                        <strong>Transfer:</strong> Transfer files to target devices
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Script Types:</strong>
                    <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <li>
                        <strong>Script-based:</strong> Batch, PowerShell, VBScript
                      </li>
                      <li>
                        <strong>Command-based:</strong> Ping, Shutdown, Restart, WakeOnLan
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Pin to Dashboard:</strong>
                    <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                      <li>Check this option to make the plan quickly accessible from the dashboard</li>
                      <li>Pinned plans appear as shortcuts for easy execution</li>
                    </ul>
                  </div>

                  <div
                    style={{
                      padding: '8px',
                      backgroundColor: '#f6ffed',
                      borderRadius: '4px',
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    <FeatherIcon icon="lightbulb" size={14} style={{ color: '#52c41a', marginRight: '4px' }} />
                    <strong>Tip:</strong> Search for existing plans to reuse configurations, or create new ones. Check
                    &quot;Apply to all computers&quot; to target all registered devices.
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

export default Planner;
