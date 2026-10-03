import React from 'react';
import { Card, Table } from 'antd';

const rows = [
  { id: 1, name: 'Acme Retail', email: 'ops@acme.com', phone: '+91-9000011111' },
  { id: 2, name: 'Beta Logistics', email: 'admin@beta.com', phone: '+91-9000022222' },
];

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'Phone', dataIndex: 'phone', key: 'phone' },
];

function CustomersPage() {
  return (
    <Card title="Customer Screen">
      <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
    </Card>
  );
}

export default CustomersPage;

