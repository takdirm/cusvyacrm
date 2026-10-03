import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';

function DashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Card>
          <Statistic title="Users" value={18} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Customers" value={52} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Active Sessions" value={31} />
        </Card>
      </Col>
      <Col span={24}>
        <Card title="Dashboard (Static Demo)">
          This is the landing page after login. Replace this section with live data from Cusvya API.
        </Card>
      </Col>
    </Row>
  );
}

export default DashboardPage;

