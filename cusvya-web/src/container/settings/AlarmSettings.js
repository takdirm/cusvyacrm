import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Card, message, Space, Spin, Checkbox } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

// Available alarm types (mapped from backend hex codes)
const ALARM_TYPES = [
  { key: 'SOS', label: 'SOS (0x01)', hexCode: '0x01' },
  { key: 'PowerCutAlarm', label: 'Power Cut Alarm (0x02)', hexCode: '0x02' },
  { key: 'ShockAlarm', label: 'Shock Alarm (0x03)', hexCode: '0x03' },
  { key: 'OverSpeedAlarm', label: 'Over Speed Alarm (0x06)', hexCode: '0x06' },
  { key: 'DeviceRemovingAlarm', label: 'Device Removing Alarm (0x0C)', hexCode: '0x0C' },
  { key: 'LowBatteryAlarm', label: 'Low Battery Alarm (0x19)', hexCode: '0x19' },
  { key: 'HighPowerVoltageAlarm', label: 'High Power Voltage Alarm (0x40)', hexCode: '0x40' },
  { key: 'HarshAccelerateAlarm', label: 'Harsh Accelerate Alarm (0x44)', hexCode: '0x44' },
  { key: 'HarshBrakingAlarm', label: 'Harsh Braking Alarm (0x45)', hexCode: '0x45' },
  { key: 'HarshCurveAlarm', label: 'Harsh Curve Alarm (0x46)', hexCode: '0x46' },
  { key: 'DeviceTurnOverAlarm', label: 'Device Turn Over Alarm (0x47)', hexCode: '0x47' },
  { key: 'ACCOnAlarm', label: 'ACC On Alarm (0xFE)', hexCode: '0xFE' },
  { key: 'ACCOffAlarm', label: 'ACC Off Alarm (0xFF)', hexCode: '0xFF' },
];

function AlarmSettings() {
  const [form] = Form.useForm();
  const [state, setState] = useState({
    loading: false,
    saving: false,
  });
  const [selectedAlarms, setSelectedAlarms] = useState([]);
  const [initialAlarms, setInitialAlarms] = useState([]);

  const { loading, saving } = state;

  const getData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      const response = await DataService.get(API.setting.alarmSettingsGet);
      const payload = response?.data?.data ?? response?.data ?? {};

      // Parse comma-separated string into array
      const significantAlarms = payload.significantAlarms || '';
      const alarmsArray = significantAlarms
        .split(',')
        .map((alarm) => alarm.trim())
        .filter((alarm) => alarm);

      setSelectedAlarms(alarmsArray);
      setInitialAlarms(alarmsArray);
      form.setFieldsValue({ alarms: alarmsArray });
    } catch (error) {
      console.error('Error fetching alarm settings:', error);
      message.error('Failed to fetch alarm settings');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSave = async () => {
    try {
      setState((prev) => ({ ...prev, saving: true }));

      // Convert array back to comma-separated string
      const significantAlarms = selectedAlarms.join(',');

      const payload = {
        significantAlarms,
      };

      await DataService.post(API.setting.alarmSettingsUpdate, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      message.success('Alarm settings updated successfully');
      setInitialAlarms(selectedAlarms);
    } catch (error) {
      console.error('Error updating alarm settings:', error);

      let errorMessage = 'Failed to update alarm settings. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleReset = () => {
    setSelectedAlarms([...initialAlarms]);
    form.setFieldsValue({ alarms: initialAlarms });
    message.info('Form reset to saved values');
  };

  const handleAlarmChange = (checkedValues) => {
    setSelectedAlarms(checkedValues);
  };

  if (loading) {
    return (
      <Main>
        <PageHeader
          ghost
          title="Alarm Settings"
          subTitle="Configure significant alarms for the system"
          buttons={[
            <Button key="back" onClick={() => window.history.back()} type="default">
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>,
          ]}
        />
        <ProjectHeader>
          <Cards headless>
            <div className="spin" style={{ minHeight: 400 }}>
              <Spin size="large" />
            </div>
          </Cards>
        </ProjectHeader>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        ghost
        title="Alarm Settings"
        subTitle="Configure significant alarms for the system"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
        ]}
      />
      <ProjectHeader>
        <Cards headless>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FeatherIcon icon="bell" size={18} />
                      <span>Significant Alarms</span>
                    </div>
                  }
                  bordered={false}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: '#666', marginBottom: 16 }}>
                      Select the alarm types that should be considered as significant for monitoring and notification
                      purposes.
                    </p>
                    <Form.Item name="alarms" style={{ marginBottom: 0 }}>
                      <Checkbox.Group style={{ width: '100%' }} value={selectedAlarms} onChange={handleAlarmChange}>
                        <Row gutter={[16, 16]}>
                          {ALARM_TYPES.map((alarm) => (
                            <Col xs={24} sm={12} md={8} key={alarm.key}>
                              <Card
                                size="small"
                                hoverable
                                style={{
                                  border: selectedAlarms.includes(alarm.key)
                                    ? '2px solid #1890ff'
                                    : '1px solid #d9d9d9',
                                  background: selectedAlarms.includes(alarm.key) ? '#e6f7ff' : '#fff',
                                  transition: 'all 0.3s',
                                }}
                              >
                                <Checkbox value={alarm.key} style={{ width: '100%' }}>
                                  <div style={{ fontWeight: 500 }}>{alarm.label}</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>{alarm.key}</div>
                                </Checkbox>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Checkbox.Group>
                    </Form.Item>
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      padding: 12,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    <strong>Selected Alarms ({selectedAlarms.length}):</strong>
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {selectedAlarms.length > 0 ? selectedAlarms.join(', ') : 'No alarms selected'}
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col>
                <Space>
                  <Button type="primary" htmlType="submit" size="large" loading={saving} disabled={saving}>
                    <FeatherIcon icon="save" size={14} style={{ marginRight: 4 }} />
                    Save Changes
                  </Button>
                  <Button type="default" size="large" onClick={handleReset} disabled={saving}>
                    <FeatherIcon icon="rotate-ccw" size={14} style={{ marginRight: 4 }} />
                    Reset
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Cards>
      </ProjectHeader>
    </Main>
  );
}

export default AlarmSettings;
