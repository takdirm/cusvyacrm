import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Card, message, Modal } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Button } from '../../components/buttons/buttons';
import { Main } from '../styled';
import Heading from '../../components/heading/heading';
import '../../config/chart'; // Import Chart.js registration

import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

function Ecommerce() {
  const [state, setState] = useState({
    deviceSummary: null,
    jobSummary: null,
    pinnedPlans: [],
    isLoadingDevices: false,
    isLoadingJobs: false,
    isLoadingPlans: false,
    deviceError: null,
    jobError: null,
    plansError: null,
    executingPlanId: null,
  });

  const {
    deviceSummary,
    jobSummary,
    pinnedPlans,
    isLoadingDevices,
    isLoadingJobs,
    isLoadingPlans,
    deviceError,
    jobError,
    plansError,
    executingPlanId,
  } = state;

  const getJobSummary = async () => {
    try {
      setState((prev) => ({ ...prev, isLoadingJobs: true, jobError: null }));

      const response = await DataService.get(`${API.metrics.jobs}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Job Summary Response:', response);

      if (response && response.data) {
        setState((prev) => ({
          ...prev,
          jobSummary: response.data,
          isLoadingJobs: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching job summary:', error);
      setState((prev) => ({
        ...prev,
        jobError: error.message || 'Failed to load job summary',
        isLoadingJobs: false,
      }));
    }
  };

  const getPinnedPlan = async () => {
    try {
      setState((prev) => ({ ...prev, isLoadingPlans: true, plansError: null }));

      const response = await DataService.get(`${API.Planner.path}/pinned`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Pinned Plans Response:', response);

      // Handle different response formats
      let plans = [];
      if (Array.isArray(response)) {
        plans = response;
      } else if (response && Array.isArray(response.data)) {
        plans = response.data;
      } else if (response && Array.isArray(response.items)) {
        plans = response.items;
      }

      setState((prev) => ({
        ...prev,
        pinnedPlans: plans,
        isLoadingPlans: false,
      }));
    } catch (error) {
      console.error('Error fetching pinned plans:', error);
      setState((prev) => ({
        ...prev,
        plansError: error.message || 'Failed to load pinned plans',
        isLoadingPlans: false,
      }));
    }
  };

  const handlePinnedPlan = async (plan) => {
    Modal.confirm({
      title: 'Execute Plan',
      icon: <FeatherIcon icon="play-circle" size={20} style={{ color: '#722ed1' }} />,
      content: (
        <div>
          <p>
            Are you sure you want to execute the plan <strong>{plan.commandName}</strong>?
          </p>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f9f0ff',
              borderRadius: '4px',
              border: '1px solid #d3adf7',
              marginTop: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <FeatherIcon icon="info" size={14} style={{ color: '#722ed1', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#722ed1', marginBottom: '4px' }}>
                  <strong>Plan Details:</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div>Plan ID: {plan.id}</div>
                  <div>Command: {plan.commandName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      okText: 'Execute',
      okType: 'primary',
      cancelText: 'Cancel',
      okButtonProps: {
        style: {
          backgroundColor: '#722ed1',
          borderColor: '#722ed1',
        },
      },
      onOk: async () => {
        try {
          setState((prev) => ({ ...prev, executingPlanId: plan.id }));

          const pinPlanDto = {
            id: plan.id,
            commandName: plan.commandName,
          };

          console.log('Executing Plan:', pinPlanDto);

          // Post the PlanDto to the trigger endpoint with headers
          const response = await DataService.post(`${API.Planner.path}/trigger-planid`, pinPlanDto, {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });

          console.log('Plan Execution Response:', response);

          message.success(`Plan "${plan.commandName}" executed successfully!`);

          // Optionally refresh job summary after execution
          setTimeout(() => {
            getJobSummary();
          }, 1000);
        } catch (error) {
          console.error('Error executing plan:', error);

          let errorMessage = 'Failed to execute plan. Please try again.';
          if (error.response && error.response.data) {
            if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          message.error(errorMessage);
        } finally {
          setState((prev) => ({ ...prev, executingPlanId: null }));
        }
      },
      onCancel() {
        console.log('Plan execution cancelled');
      },
    });
  };

  const getDeviceSummary = async () => {
    try {
      setState((prev) => ({ ...prev, isLoadingDevices: true, deviceError: null }));

      const response = await DataService.get(`${API.metrics.devices}`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      console.log('Device Summary Response:', response);

      if (response && response.data) {
        setState((prev) => ({
          ...prev,
          deviceSummary: response.data,
          isLoadingDevices: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching device summary:', error);
      setState((prev) => ({
        ...prev,
        deviceError: error.message || 'Failed to load device summary',
        isLoadingDevices: false,
      }));
    }
  };

  const handleRefresh = () => {
    // Commented out old API calls - these endpoints don't exist in the new backend
    // getDeviceSummary();
    // getJobSummary();
    // getPinnedPlan();
  };

  useEffect(() => {
    // Commented out old API calls - these endpoints don't exist in the new backend
    // getDeviceSummary();
    // getJobSummary();
    // getPinnedPlan();
  }, []);

  // Render Device Summary Cards
  const renderDeviceSummaryCards = () => {
    if (isLoadingDevices) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Loading device summary...</p>
          </div>
        </Col>
      );
    }

    if (deviceError) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FeatherIcon icon="alert-circle" size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />
            <p style={{ color: '#ff4d4f' }}>{deviceError}</p>
            <Button type="primary" onClick={getDeviceSummary} style={{ marginTop: '16px' }}>
              Retry
            </Button>
          </div>
        </Col>
      );
    }

    if (!deviceSummary) return null;

    return (
      <>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: '12px',
              border: '2px solid #1890ff',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                  Total Devices
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                  {deviceSummary.totalDevices || 0}
                </div>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#e6f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FeatherIcon icon="monitor" size={32} style={{ color: '#1890ff' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: '12px',
              border: '2px solid #52c41a',
              boxShadow: '0 4px 12px rgba(82, 196, 26, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                  Online Devices
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                  {deviceSummary.onlineDevices || 0}
                </div>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FeatherIcon icon="wifi" size={32} style={{ color: '#52c41a' }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: '12px',
              border: '2px solid #ff4d4f',
              boxShadow: '0 4px 12px rgba(255, 77, 79, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                  Offline Devices
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  {deviceSummary.offlineDevices || 0}
                </div>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#fff2f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FeatherIcon icon="wifi-off" size={32} style={{ color: '#ff4d4f' }} />
              </div>
            </div>
          </Card>
        </Col>
      </>
    );
  };

  // Render Job Summary Cards
  const renderJobSummaryCards = () => {
    if (isLoadingJobs) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Loading job summary...</p>
          </div>
        </Col>
      );
    }

    if (jobError) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FeatherIcon icon="alert-circle" size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />
            <p style={{ color: '#ff4d4f' }}>{jobError}</p>
            <Button type="primary" onClick={getJobSummary} style={{ marginTop: '16px' }}>
              Retry
            </Button>
          </div>
        </Col>
      );
    }

    if (!jobSummary) return null;

    const jobCards = [
      {
        key: 'total',
        title: 'Total Jobs',
        value: jobSummary.totalJobs || 0,
        icon: 'layers',
        color: '#1890ff',
        bgColor: '#e6f7ff',
      },
      {
        key: 'initiated',
        title: 'Initiated Jobs',
        value: jobSummary.initiatedJobs || 0,
        icon: 'play-circle',
        color: '#faad14',
        bgColor: '#fff7e6',
      },
      {
        key: 'pending',
        title: 'Pending Jobs',
        value: jobSummary.pendingJobs || 0,
        icon: 'clock',
        color: '#1890ff',
        bgColor: '#e6f7ff',
      },
      {
        key: 'success',
        title: 'Success Jobs',
        value: jobSummary.successJobs || 0,
        icon: 'check-circle',
        color: '#52c41a',
        bgColor: '#f6ffed',
      },
      {
        key: 'errored',
        title: 'Errored Jobs',
        value: jobSummary.erroredJobs || 0,
        icon: 'x-circle',
        color: '#ff4d4f',
        bgColor: '#fff2f0',
      },
    ];

    return jobCards.map((card) => (
      <Col xs={24} sm={12} md={8} lg={4.8} key={card.key}>
        <Card
          hoverable
          style={{
            borderRadius: '12px',
            border: `2px solid ${card.color}`,
            boxShadow: `0 4px 12px ${card.color}1A`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: card.color }}>{card.value}</div>
            </div>
            <div
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '10px',
                backgroundColor: card.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FeatherIcon icon={card.icon} size={22} style={{ color: card.color }} />
            </div>
          </div>
        </Card>
      </Col>
    ));
  };

  // Render Pinned Plans Cards
  const renderPinPlansCard = () => {
    if (isLoadingPlans) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>Loading pinned plans...</p>
          </div>
        </Col>
      );
    }

    if (plansError) {
      return (
        <Col xs={24}>
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FeatherIcon icon="alert-circle" size={48} style={{ color: '#ff4d4f', marginBottom: '16px' }} />
            <p style={{ color: '#ff4d4f' }}>{plansError}</p>
            <Button type="primary" onClick={getPinnedPlan} style={{ marginTop: '16px' }}>
              Retry
            </Button>
          </div>
        </Col>
      );
    }

    if (!pinnedPlans || pinnedPlans.length === 0) {
      return (
        <Col xs={24}>
          <Card
            style={{
              borderRadius: '12px',
              textAlign: 'center',
              padding: '30px',
              border: '2px dashed #d9d9d9',
            }}
          >
            <FeatherIcon icon="bookmark" size={48} style={{ color: '#d9d9d9', marginBottom: '16px' }} />
            <p style={{ color: '#999', fontSize: '14px', margin: 0 }}>
              No pinned plans available. Pin plans from the Plan Executor to see them here.
            </p>
          </Card>
        </Col>
      );
    }

    return pinnedPlans.map((plan) => (
      <Col xs={12} sm={8} md={6} lg={4} xl={3} key={plan.id}>
        <Card
          hoverable
          onClick={() => handlePinnedPlan(plan)}
          style={{
            borderRadius: '8px',
            border: '2px solid #722ed1',
            boxShadow: '0 2px 6px rgba(114, 46, 209, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            opacity: executingPlanId === plan.id ? 0.6 : 1,
          }}
          bodyStyle={{
            padding: '12px',
          }}
        >
          {executingPlanId === plan.id && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <Spin size="default" />
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '8px',
                backgroundColor: '#f9f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <FeatherIcon icon="play-circle" size={18} style={{ color: '#722ed1' }} />
            </div>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#722ed1',
                  marginBottom: '2px',
                  wordBreak: 'break-word',
                  lineHeight: '1.3',
                }}
              >
                {plan.commandName}
              </div>
              <div style={{ fontSize: '9px', color: '#999' }}>ID: {plan.id}</div>
            </div>
          </div>
        </Card>
      </Col>
    ));
  };

  return (
    <>
      <PageHeader
        ghost
        title="Rollout Dashboard"
        buttons={[
          <Button key="refresh" type="primary" size="small" onClick={handleRefresh}>
            <FeatherIcon icon="refresh-cw" size={16} style={{ marginRight: '8px' }} />
            Refresh
          </Button>,
        ]}
      />
      <Main>
        {/* Device Summary Section */}
        <Row gutter={25} style={{ marginBottom: '30px' }}>
          <Col xs={24}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: '#1890ff',
                  borderRadius: '2px',
                }}
              />
              <Heading as="h3" style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Device Summary
              </Heading>
            </div>
          </Col>
          {renderDeviceSummaryCards()}
        </Row>

        {/* Pinned Plan Section */}
        <Row gutter={25} style={{ marginBottom: '30px' }}>
          <Col xs={24}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: '#722ed1',
                  borderRadius: '2px',
                }}
              />
              <Heading as="h3" style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Execution Shortcuts
              </Heading>
            </div>
          </Col>
          {renderPinPlansCard()}
        </Row>

        {/* Job Summary Section */}
        <Row gutter={25}>
          <Col xs={24}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: '#52c41a',
                  borderRadius: '2px',
                }}
              />
              <Heading as="h3" style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Job Summary
              </Heading>
            </div>
          </Col>
          {renderJobSummaryCards()}
        </Row>
      </Main>
    </>
  );
}

export default Ecommerce;
