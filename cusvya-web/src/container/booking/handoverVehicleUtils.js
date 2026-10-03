import React from 'react';
import PlainLabel from '../../components/labels/plain-label';

export const val = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
};

export const getVerificationStatusMeta = (status) => {
  const numericStatus = Number(status);
  if (numericStatus === 2)
    return {
      label: 'Approved',
      plainLabelColor: 'success',
      background: '#f6ffed',
      border: '#52c41a',
      color: '#389e0d',
    };
  if (numericStatus === 1)
    return {
      label: 'Pending Approval',
      plainLabelColor: 'warning',
      background: '#fff7e6',
      border: '#faad14',
      color: '#d48806',
    };
  if (numericStatus === 3)
    return { label: 'Rejected', plainLabelColor: 'red', background: '#fff1f0', border: '#cf1322', color: '#a8071a' };
  return { label: 'Not Initiated', plainLabelColor: 'red', background: '#fff1f0', border: '#ff4d4f', color: '#cf1322' };
};

export const renderKycLabel = (status) => {
  const meta = getVerificationStatusMeta(status);
  return <PlainLabel color={meta.plainLabelColor}>{meta.label}</PlainLabel>;
};

export const renderStatusBadge = (title, status) => {
  const meta = getVerificationStatusMeta(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${meta.border}`,
        backgroundColor: meta.background,
        color: meta.color,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {`${title} = ${meta.label}`}
    </span>
  );
};

export const normalizeEnumKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const summaryColumns = [
  { title: 'Field', dataIndex: 'label', key: 'label', width: '40%', render: (text) => <strong>{text}</strong> },
  { title: 'Value', dataIndex: 'value', key: 'value', width: '60%' },
];
