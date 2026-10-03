import React from 'react';
import { Card, Descriptions } from 'antd';

function SettingsPage() {
  return (
    <Card title="Application Settings Screen">
      <Descriptions bordered column={1}>
        <Descriptions.Item label="API Base URL">http://localhost:5000</Descriptions.Item>
        <Descriptions.Item label="Auth Provider">Firebase (to be configured)</Descriptions.Item>
        <Descriptions.Item label="Default Language">en</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

export default SettingsPage;

