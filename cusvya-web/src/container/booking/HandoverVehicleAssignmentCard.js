import React from 'react';
import { Col, Empty, Pagination, Spin, Table, Tabs } from 'antd';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Button } from '../../components/buttons/buttons';
import { val } from './handoverVehicleUtils';

function VehicleList({ data, loading, emptyText, page, pageSize, total, setPage, setPageSize, columns }) {
  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  if (!data.length) return <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  return (
    <>
      <Table
        className="table-responsive"
        rowKey={(record) => String(record.id ?? record.vehicleId)}
        dataSource={data}
        columns={columns}
        pagination={false}
        scroll={{ x: 960 }}
      />
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage, size) => {
            setPage(nextPage);
            setPageSize(size);
          }}
          showSizeChanger
          pageSizeOptions={['10', '20', '50']}
          showTotal={(count, range) => `${range[0]}-${range[1]} of ${count} items`}
        />
      </div>
    </>
  );
}

function HandoverVehicleAssignmentCard(props) {
  const {
    activeBookingId,
    booking,
    isOwnershipBooking,
    isRentalBooking,
    activeVehicleTab,
    setActiveVehicleTab,
    vehicles,
    newVehicles,
    loadingVehicles,
    loadingNewVehicles,
    currentPage,
    pageSize,
    totalCount,
    setCurrentPage,
    setPageSize,
    newVehiclesPage,
    newVehiclesPageSize,
    newVehiclesTotalCount,
    setNewVehiclesPage,
    setNewVehiclesPageSize,
    actionLoadingId,
    handleAssignVehicle,
  } = props;
  const renderCatalogueInfo = (_, record) => {
    const bookingCatalogueName = booking?.vehicleCatalogueName ?? booking?.catalogue?.name;
    const bookingCatalogueColorName =
      booking?.catalogueColorName ??
      booking?.catalogueColourName ??
      booking?.catalogueColor?.colorName ??
      booking?.catalogueColor?.ColorName ??
      booking?.catalogueColor?.name;

    const catalogueName = val(
      record?.vehicleCatalogueSummary ??
        record?.catalogueName ??
        record?.vehicleCatalogueName ??
        record?.catalogue?.name ??
        bookingCatalogueName,
    );
    const catalogueId = val(record?.vehicleCatalogueId ?? record?.catalogueId ?? record?.catalogue?.id);
    const colourName = val(
      record?.catalogueColor?.colorName ??
        record?.catalogueColor?.ColorName ??
        record?.catalogueColorName ??
        record?.catalogueColourName ??
        record?.catalogueColor?.name ??
        record?.catalogueColour?.colorName ??
        record?.catalogueColour?.ColorName ??
        record?.catalogueColour?.name ??
        bookingCatalogueColorName,
    );

    return (
      <div style={{ whiteSpace: 'pre-line', lineHeight: 1.35 }}>
        {`Name: ${catalogueName}\nID: ${catalogueId}\nColour Name: ${colourName}`}
      </div>
    );
  };

  const columns = [
    {
      title: 'Vehicle ID',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (value, record) => val(value ?? record.vehicleId),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value, record) => val(value ?? record.vehicleName),
    },
    {
      title: 'Model',
      dataIndex: 'vehicleModelName',
      key: 'vehicleModelName',
      width: 180,
      render: (value, record) => val(value ?? record.modelName ?? record.vehicleModel?.name),
    },
    {
      title: 'Registration',
      dataIndex: 'registerationNumber',
      key: 'registerationNumber',
      width: 170,
      render: (value, record) => val(value ?? record.vehicleRegisterationNumber ?? record.registrationNumber),
    },
    { title: 'Station', dataIndex: 'stationName', key: 'stationName', width: 180, render: val },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const id = record?.id ?? record?.vehicleId;
        return (
          <Button
            size="small"
            type="primary"
            onClick={() => handleAssignVehicle(record)}
            disabled={actionLoadingId === id}
          >
            {actionLoadingId === id
              ? isRentalBooking
                ? 'Reassigning...'
                : 'Assigning...'
              : isRentalBooking
                ? 'Reassign'
                : 'Assign'}
          </Button>
        );
      },
    },
  ];
  const newVehicleColumns = [
    {
      title: 'Vehicle ID',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (value, record) => val(value ?? record.vehicleId),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value, record) => val(value ?? record.vehicleName),
    },
    { title: 'Catalogue', key: 'catalogueInfo', width: 230, render: renderCatalogueInfo },
    {
      title: 'Registration',
      dataIndex: 'registerationNumber',
      key: 'registerationNumber',
      width: 170,
      render: (value, record) => val(value ?? record.vehicleRegisterationNumber ?? record.registrationNumber),
    },
    { title: 'Station', dataIndex: 'stationName', key: 'stationName', width: 180, render: val },
    {
      title: 'Action',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const id = record?.id ?? record?.vehicleId;
        return (
          <Button
            size="small"
            type="primary"
            onClick={() => handleAssignVehicle(record)}
            disabled={actionLoadingId === id}
          >
            {actionLoadingId === id
              ? isRentalBooking
                ? 'Reassigning...'
                : 'Assigning...'
              : isRentalBooking
                ? 'Reassign'
                : 'Assign'}
          </Button>
        );
      },
    },
  ];
  const temporary = (
    <VehicleList
      data={vehicles}
      loading={loadingVehicles}
      emptyText="No unassigned vehicles found"
      page={currentPage}
      pageSize={pageSize}
      total={totalCount}
      setPage={setCurrentPage}
      setPageSize={setPageSize}
      columns={columns}
    />
  );
  const fresh = (
    <VehicleList
      data={newVehicles}
      loading={loadingNewVehicles}
      emptyText="No new vehicles available"
      page={newVehiclesPage}
      pageSize={newVehiclesPageSize}
      total={newVehiclesTotalCount}
      setPage={setNewVehiclesPage}
      setPageSize={setNewVehiclesPageSize}
      columns={newVehicleColumns}
    />
  );
  return (
    <Col xs={24}>
      <Cards title={isRentalBooking ? 'Reassign Vehicle' : 'Assign'} headless={false}>
        {!activeBookingId || !booking ? (
          <Empty description="Load booking to view vehicles" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : isOwnershipBooking ? (
          <Tabs
            activeKey={activeVehicleTab}
            onChange={(key) => {
              setActiveVehicleTab(key);
              if (key === 'temporary') setCurrentPage(1);
              else if (key === 'new') setNewVehiclesPage(1);
            }}
            items={[
              { key: 'temporary', label: 'Assign Temporary Vehicle', children: temporary },
              { key: 'new', label: 'New Vehicle', children: fresh },
            ]}
          />
        ) : (
          temporary
        )}
      </Cards>
    </Col>
  );
}
export default HandoverVehicleAssignmentCard;
