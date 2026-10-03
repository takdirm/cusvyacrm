import React from 'react';
import { Modal, Spin, Table } from 'antd';
import moment from 'moment';
import { Button } from '../../components/buttons/buttons';
import { renderKycLabel, summaryColumns, val } from './handoverVehicleUtils';

function HandoverVerificationModal({ type, open, onCancel, approved, submitting, onApprove, loading, customerId, data, status, frontDocument, backDocument, buildDocumentUrl }) {
  const isKyc = type === 'kyc';
  const title = isKyc ? 'Customer KYC' : 'Customer Driving Licence';
  const approveText = isKyc ? 'Approve KYC' : 'Approve Driving Licence';
  const rows = [{ label: 'Customer ID', value: val(customerId) }];
  rows.push(isKyc ? { label: 'Aadhar Number', value: data?.aadharNumber ? `XXXX XXXX ${String(data.aadharNumber).replace(/\s/g, '').slice(-4)}` : '-' } : { label: 'DL Number', value: val(data?.drivingLicenceNumber) });
  rows.push({ label: 'Status', value: renderKycLabel(status) });
  const addDoc = (label, doc, alt) => rows.push({ label, value: buildDocumentUrl(doc?.filePath) ? <img src={buildDocumentUrl(doc?.filePath)} alt={alt} style={{ width: '100%', maxWidth: 280, borderRadius: 8 }} /> : '-' });
  addDoc(isKyc ? 'Aadhar Front' : 'DL Front', frontDocument, isKyc ? 'Aadhar Front' : 'DL Front');
  addDoc(isKyc ? 'Aadhar Back' : 'DL Back', backDocument, isKyc ? 'Aadhar Back' : 'DL Back');
  rows.push({ label: 'Created At', value: data?.createdAt ? moment(data.createdAt).format('YYYY-MM-DD HH:mm') : '-' }, { label: 'Updated At', value: data?.updatedAt ? moment(data.updatedAt).format('YYYY-MM-DD HH:mm') : '-' });
  const footer = [<Button key="close" onClick={onCancel}>Close</Button>];
  if (!approved) footer.push(<Button key="approve" type="primary" onClick={onApprove} loading={submitting}>{approveText}</Button>);
  return <Modal title={title} open={open} onCancel={onCancel} footer={footer} destroyOnClose>{loading ? <div style={{textAlign:'center',padding:32}}><Spin/></div> : <Table rowKey="label" dataSource={rows} columns={summaryColumns} pagination={false} size="small" />}</Modal>;
}
export default HandoverVerificationModal;
