import React from 'react';
import { Form, Input, Modal } from 'antd';

function HandoverAssignmentModal({ isRentalBooking, open, onCancel, onOk, confirmLoading, form }) {
  return <Modal title={isRentalBooking ? 'Confirm Reassign' : 'Confirm Assign'} open={open} onCancel={onCancel} onOk={onOk} confirmLoading={confirmLoading} okText={isRentalBooking ? 'Reassign' : 'Assign'} cancelText="Cancel" destroyOnClose><Form form={form} layout="vertical"><div style={{marginBottom:16}}>{isRentalBooking ? 'Vehicle is already assigned to this booking. Add notes before reassigning.' : 'Add optional notes before assigning this vehicle.'}</div><Form.Item label="Notes" name="notes" rules={isRentalBooking ? [{required:true,whitespace:true,message:'Notes are required for rental bookings'}] : []}><Input.TextArea rows={4} placeholder={isRentalBooking ? 'Enter notes' : 'Add notes (optional)'} /></Form.Item></Form></Modal>;
}
export default HandoverAssignmentModal;
