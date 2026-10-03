import React from 'react';
import { Card, Table, Tag } from 'antd';

const rows = [
  { id: 1, name: 'Admin User', email: 'admin@cusvya.com', active: true },
  { id: 2, name: 'Operations User', email: 'ops@cusvya.com', active: false },
];

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  {
    title: 'Status',
    dataIndex: 'active',
    key: 'active',
    render: (active) => (active ? <Tag color="green">Active</Tag> : <Tag color="orange">Inactive</Tag>),
  },
];

function UsersPage() {
  return (
    <Card title="Users Screen">
      <Table rowKey="id" columns={columns} dataSource={rows} pagination={false} />
    </Card>
  );
}

export default UsersPage;

