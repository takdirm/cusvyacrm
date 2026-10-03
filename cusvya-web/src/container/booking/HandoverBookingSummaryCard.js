import React from 'react';
import { Col, Empty, Input, Row, Spin, Table } from 'antd';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Button } from '../../components/buttons/buttons';
import { renderStatusBadge, summaryColumns } from './handoverVehicleUtils';

function HandoverBookingSummaryCard({
  bookingIdInput,
  setBookingIdInput,
  isBookingIdFromUrl,
  handleLoadBooking,
  loadingBooking,
  booking,
  bookingSummaryLeft,
  bookingSummaryRight,
  customerKycStatus,
  customerDlStatus,
  isDrivingLicenseRequired,
  openKycModal,
  openDlModal,
  openHandoverModal,
  handleCancelBooking,
  canProceedWithHandover,
  canCancelBooking,
  assignedAccessories,
}) {
  return (
    <Row gutter={16}>
      <Col xs={24} style={{ marginBottom: 16 }}>
        <Cards
          headless={false}
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Input
                  value={bookingIdInput}
                  onChange={(e) => setBookingIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter Booking ID"
                  style={{ width: 180 }}
                  disabled={isBookingIdFromUrl}
                  onPressEnter={handleLoadBooking}
                />
                {!isBookingIdFromUrl ? (
                  <Button
                    type="primary"
                    onClick={handleLoadBooking}
                    style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}
                  >
                    Load
                  </Button>
                ) : null}
              </div>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: '#1f2937',
                }}
              >
                Booking Summary
              </span>
            </div>
          }
        >
          {loadingBooking ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : booking ? (
            <>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Table
                    rowKey="label"
                    dataSource={bookingSummaryLeft}
                    columns={summaryColumns}
                    pagination={false}
                    size="small"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Table
                    rowKey="label"
                    dataSource={bookingSummaryRight}
                    columns={summaryColumns}
                    pagination={false}
                    size="small"
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {renderStatusBadge('KYC Status', customerKycStatus)}
                  {isDrivingLicenseRequired ? renderStatusBadge('Driving Licence Status', customerDlStatus) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Button type="default" outlined onClick={openKycModal} style={{ fontSize: 15, fontWeight: 600 }}>
                    Approve KYC
                  </Button>
                  <Button type="default" outlined onClick={openDlModal} style={{ fontSize: 15, fontWeight: 600 }}>
                    Approve Driving Licence
                  </Button>
                  <Button
                    type="primary"
                    onClick={openHandoverModal}
                    disabled={!canProceedWithHandover}
                    style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}
                  >
                    Initiate Handover
                  </Button>
                  <Button
                    type="danger"
                    outlined
                    onClick={handleCancelBooking}
                    disabled={!canCancelBooking}
                    style={{ fontSize: 15, fontWeight: 600 }}
                  >
                    Cancel booking
                  </Button>
                </div>
              </div>
              <Cards title="Assigned Accessories" headless={false} style={{ marginTop: 16 }}>
                {assignedAccessories.length === 0 ? (
                  <Empty description="No accessories assigned" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    rowKey={(record, index) => `${record.accessorieId}-${index}`}
                    pagination={false}
                    dataSource={assignedAccessories}
                    columns={[
                      { title: 'Accessory', dataIndex: 'accessorieName', key: 'accessorieName' },
                      { title: 'Mode', key: 'mode', render: (_, row) => (row.isRental ? 'Rent' : 'Sold') },
                      {
                        title: 'Status',
                        key: 'status',
                        render: (_, row) => {
                          if (!row.isRental) return 'Sold';
                          if (row.isLost) return 'Lost';
                          if (row.isReturned) return 'Returned';
                          return 'Pending Return';
                        },
                      },
                    ]}
                  />
                )}
              </Cards>
            </>
          ) : (
            <Empty description="Enter booking ID to load details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Cards>
      </Col>
    </Row>
  );
}
export default HandoverBookingSummaryCard;
