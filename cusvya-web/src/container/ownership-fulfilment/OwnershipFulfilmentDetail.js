import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  message,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import {
  OwnershipFulfilmentStatus,
  OwnershipFulfilmentStatusStyles,
  FulfilmentSourceStyles,
  FulfilmentSource,
} from './ownershipFulfilmentStatus';
import {
  createOwnershipFulfilment,
  getAvailableVendorsForCatalogue,
  getOwnershipFulfilmentById,
  getOwnershipFulfilments,
  submitFulfilmentAction,
} from './ownershipFulfilmentService';
import { getAvailableOwnershipActions, getOwnershipActionLabel } from '../booking/ownershipActionHelper';
import { BookingStatus, BookingType } from '../booking/bookingEnums';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

const statusLabel = (value) => {
  const key = Number(value);
  return (
    <Tag style={OwnershipFulfilmentStatusStyles[key] || OwnershipFulfilmentStatusStyles.default}>
      {OwnershipFulfilmentStatus[key] || value}
    </Tag>
  );
};

const sourceLabel = (value) => {
  const key = Number(value);
  return (
    <Tag style={FulfilmentSourceStyles[key] || FulfilmentSourceStyles.default}>{FulfilmentSource[key] || value}</Tag>
  );
};

const toReadableBookingStatus = (value) => {
  const key = Number(value);
  if (!Number.isNaN(key) && BookingStatus[key]) return BookingStatus[key];
  return value;
};

const toReadableBookingType = (value) => {
  const key = Number(value);
  if (!Number.isNaN(key) && BookingType[key]) return BookingType[key];
  return value;
};

const FIELD_TYPES = {
  text: 'text',
  number: 'number',
  textarea: 'textarea',
  select: 'select',
  datetime: 'datetime',
  checkbox: 'checkbox',
};

const ACTION_KEY_MAP = {
  markNotInStock: 'notInStock',
};

const ACTION_META = {
  assignVendor: { title: 'Assign Vendor', confirmText: 'Assign Vendor' },
  confirmVendor: { title: 'Confirm Vendor', confirmText: 'Confirm Vendor' },
  notInStock: { title: 'Mark Not In Stock', confirmText: 'Mark Not In Stock' },
  dispatch: { title: 'Dispatch Vehicle', confirmText: 'Dispatch' },
  deliver: { title: 'Mark Delivered', confirmText: 'Deliver' },
  receiveVehicle: { title: 'Receive Vehicle', confirmText: 'Receive Vehicle' },
  prepare: { title: 'Prepare Vehicle', confirmText: 'Prepare' },
  readyForPickup: { title: 'Mark Ready For Pickup', confirmText: 'Ready For Pickup' },
  complete: { title: 'Complete Fulfilment', confirmText: 'Complete' },
  cancel: { title: 'Cancel Fulfilment', confirmText: 'Cancel' },
};

function ActionModal({
  title,
  visible,
  fields,
  confirmText,
  initialValues,
  loading,
  onCancel,
  onSubmit,
  vendors,
  booking,
  fulfilment,
}) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!visible) return;
    form.setFieldsValue(initialValues || {});
  }, [visible, initialValues, form]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={confirmText}
      confirmLoading={loading}
      destroyOnClose
      width={720}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          const payload = {};
          fields.forEach((field) => {
            const value = values[field.name];
            if (field.type === FIELD_TYPES.number)
              payload[field.name] = value === undefined || value === null || value === '' ? null : Number(value);
            else if (field.type === FIELD_TYPES.datetime)
              payload[field.name] = value ? new Date(value).toISOString() : null;
            else if (field.type === FIELD_TYPES.checkbox) payload[field.name] = Boolean(value);
            else payload[field.name] = value;
          });
          await onSubmit(payload);
        }}
      >
        <Row gutter={16}>
          {fields.map((field) => (
            <Col key={field.name} xs={24} md={field.span || 12}>
              <Form.Item
                name={field.name}
                label={field.label}
                rules={field.rules || []}
                valuePropName={field.type === FIELD_TYPES.checkbox ? 'checked' : 'value'}
              >
                {field.type === FIELD_TYPES.select ? (
                  <Select
                    placeholder={field.placeholder || field.label}
                    options={field.options || []}
                    showSearch={field.showSearch}
                    optionFilterProp="label"
                  />
                ) : field.type === FIELD_TYPES.textarea ? (
                  <Input.TextArea rows={4} placeholder={field.placeholder || field.label} />
                ) : field.type === FIELD_TYPES.number ? (
                  <InputNumber style={{ width: '100%' }} placeholder={field.placeholder || field.label} />
                ) : field.type === FIELD_TYPES.datetime ? (
                  <Input type="datetime-local" />
                ) : field.type === FIELD_TYPES.checkbox ? (
                  <Checkbox />
                ) : (
                  <Input placeholder={field.placeholder || field.label} />
                )}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Form>
    </Modal>
  );
}

function OwnershipFulfilmentDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, bookingId } = useParams();
  const [fulfilment, setFulfilment] = useState(location.state?.fulfilment || null);
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(false);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    fields: [],
    confirmText: 'Submit',
    initialValues: {},
  });

  const loadVendors = async (catalogueId) => {
    if (!catalogueId) {
      setAvailableVendors([]);
      return;
    }

    try {
      const vendors = await getAvailableVendorsForCatalogue(catalogueId);
      const ordered = (Array.isArray(vendors) ? vendors : []).sort((a, b) => {
        const priorityCompare = Number(a.priority || 0) - Number(b.priority || 0);
        if (priorityCompare !== 0) return priorityCompare;
        const leadA = a.leadTimeDays ?? Number.MAX_SAFE_INTEGER;
        const leadB = b.leadTimeDays ?? Number.MAX_SAFE_INTEGER;
        if (leadA !== leadB) return leadA - leadB;
        return String(a.vendorName || '').localeCompare(String(b.vendorName || ''));
      });
      setAvailableVendors(ordered);
    } catch (error) {
      setAvailableVendors([]);
    }
  };

  const loadBooking = async (bookingIdToLoad) => {
    if (!bookingIdToLoad) return null;
    try {
      const response = await DataService.get(`${API.booking.path}/${bookingIdToLoad}`);
      const result = response.data || null;
      setBooking(result);
      return result;
    } catch (error) {
      return null;
    }
  };

  const loadFulfilment = async () => {
    try {
      setLoading(true);
      let current = null;
      const items = await getOwnershipFulfilments();

      if (id) {
        current = await getOwnershipFulfilmentById(id);
      } else if (bookingId) {
        current = items.find((item) => Number(item.bookingId) === Number(bookingId)) || null;
        if (!current) {
          current = await createOwnershipFulfilment(bookingId);
        }
      }

      if (!current && items.length > 0) {
        current = items[0];
      }

      setFulfilment(current);
      await loadVendors(current?.catalogueId);
      if (current?.bookingId) {
        await loadBooking(current.bookingId);
      } else if (bookingId) {
        await loadBooking(bookingId);
      }
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to load fulfilment details');
      setFulfilment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFulfilment();
  }, [id, bookingId]);

  const refresh = async () => {
    await loadFulfilment();
  };

  const openAction = (type) => {
    const vendorOptions = availableVendors.map((vendor) => ({
      value: vendor.vendorId,
      label: `${vendor.vendorName} • ${vendor.purchasePrice != null ? `₹${Number(vendor.purchasePrice).toLocaleString()}` : 'No price'} • ${vendor.leadTimeDays ?? '-'} days • P${vendor.priority ?? 0}`,
    }));
    const recommendedVendor = availableVendors[0];
    const currentYear = new Date().getFullYear();
    const baseValues = {
      notes: '',
      vendorConfirmedAt: new Date().toISOString().slice(0, 16),
      dispatchDate: new Date().toISOString().slice(0, 16),
      deliveredAt: new Date().toISOString().slice(0, 16),
      isCertified: false,
      initialOdometerReading: 0,
      vendorId: recommendedVendor?.vendorId,
      vendorCost: recommendedVendor?.purchasePrice ?? null,
    };

    const config = {
      assignVendor: {
        title: ACTION_META.assignVendor.title,
        confirmText: ACTION_META.assignVendor.confirmText,
        fields: [
          {
            name: 'vendorId',
            label: 'Vendor',
            type: FIELD_TYPES.select,
            rules: [{ required: true, message: 'Vendor is required' }],
            options: vendorOptions,
            showSearch: true,
          },
          { name: 'vendorOrderNumber', label: 'Vendor Order Number', type: FIELD_TYPES.text },
          { name: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: FIELD_TYPES.datetime },
          { name: 'vendorCost', label: 'Vendor Cost', type: FIELD_TYPES.number },
          { name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea },
        ],
      },
      confirmVendor: {
        title: ACTION_META.confirmVendor.title,
        confirmText: ACTION_META.confirmVendor.confirmText,
        fields: [
          { name: 'vendorOrderNumber', label: 'Vendor Order Number', type: FIELD_TYPES.text },
          { name: 'vendorConfirmedAt', label: 'Vendor Confirmed At', type: FIELD_TYPES.datetime },
          { name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea },
        ],
      },
      notInStock: {
        title: ACTION_META.notInStock.title,
        confirmText: ACTION_META.notInStock.confirmText,
        fields: [{ name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea }],
      },
      dispatch: {
        title: ACTION_META.dispatch.title,
        confirmText: ACTION_META.dispatch.confirmText,
        fields: [
          { name: 'dispatchDate', label: 'Dispatch Date', type: FIELD_TYPES.datetime },
          { name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea },
        ],
      },
      deliver: {
        title: ACTION_META.deliver.title,
        confirmText: ACTION_META.deliver.confirmText,
        fields: [
          { name: 'deliveredAt', label: 'Delivered At', type: FIELD_TYPES.datetime },
          { name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea },
        ],
      },
      receiveVehicle: {
        title: ACTION_META.receiveVehicle.title,
        confirmText: ACTION_META.receiveVehicle.confirmText,
        fields: [
          { name: 'vehicleId', label: 'Existing Vehicle ID (Optional)', type: FIELD_TYPES.number },
          { name: 'registerationNumber', label: 'Registration Number', type: FIELD_TYPES.text },
          { name: 'chassisNumber', label: 'Chassis Number', type: FIELD_TYPES.text },
          {
            name: 'warrantyPeriod',
            label: 'Warranty Period',
            type: FIELD_TYPES.text,
            rules: [{ required: true, message: 'Warranty period is required' }],
          },
          { name: 'isCertified', label: 'Certified', type: FIELD_TYPES.checkbox },
          { name: 'initialOdometerReading', label: 'Initial Odometer Reading', type: FIELD_TYPES.number },
          { name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea, span: 24 },
        ],
      },
      prepare: {
        title: ACTION_META.prepare.title,
        confirmText: ACTION_META.prepare.confirmText,
        fields: [{ name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea }],
      },
      readyForPickup: {
        title: ACTION_META.readyForPickup.title,
        confirmText: ACTION_META.readyForPickup.confirmText,
        fields: [{ name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea }],
      },
      complete: {
        title: ACTION_META.complete.title,
        confirmText: ACTION_META.complete.confirmText,
        fields: [{ name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea }],
      },
      cancel: {
        title: ACTION_META.cancel.title,
        confirmText: ACTION_META.cancel.confirmText,
        fields: [{ name: 'notes', label: 'Notes', type: FIELD_TYPES.textarea }],
      },
    };

    const next = config[type];
    if (!next) return;
    setActionType(type);
    setModalState({
      visible: true,
      title: next.title,
      fields: next.fields,
      confirmText: next.confirmText,
      initialValues: baseValues,
    });
  };

  const closeModal = () => {
    if (actionLoading) return;
    setModalState((current) => ({ ...current, visible: false }));
    setActionType(null);
  };

  const submitAction = async (payload) => {
    if (!actionType || !fulfilment?.id) return;

    if (actionType === 'readyForPickup') {
      const bookingStationId = Number(booking?.stationId);
      const vehicleStationId = Number(fulfilment?.vehicleStationId);
      if (!Number.isNaN(bookingStationId) && !Number.isNaN(vehicleStationId) && bookingStationId !== vehicleStationId) {
        message.error('Vehicle is not in Pickup Station.');
        return;
      }
    }

    try {
      setActionLoading(true);
      await submitFulfilmentAction(fulfilment.id, actionType, payload);
      message.success(`${getOwnershipActionLabel(actionType)} completed.`);
      closeModal();
      await refresh();
    } catch (error) {
      if (actionType === 'assignVendor') {
        await loadVendors(fulfilment?.catalogueId);
      }
      message.error(error?.response?.data?.message || error?.message || 'Failed to update fulfilment');
    } finally {
      setActionLoading(false);
    }
  };

  const availableActions = useMemo(() => {
    const rawActions = getAvailableOwnershipActions({ bookingType: 1, status: booking?.status }, fulfilment);
    return rawActions
      .map((action) => ACTION_KEY_MAP[action] || action)
      .filter((action) => action !== 'viewFulfilment' && action !== 'createFulfilment');
  }, [fulfilment, booking?.status]);

  const isBookingVehicleAssigned = useMemo(() => {
    const statusNumber = Number(booking?.status);
    if (!Number.isNaN(statusNumber)) return statusNumber === 4;
    return (
      String(booking?.status || '')
        .trim()
        .toLowerCase() === 'vehicleassigned'
    );
  }, [booking?.status]);

  const nextAction = useMemo(() => availableActions.find((action) => action !== 'cancel') || null, [availableActions]);

  const bookingSummary = booking
    ? [
        { label: 'Booking ID', value: booking.id },
        { label: 'Booking Type', value: toReadableBookingType(booking.bookingType) },
        { label: 'Status', value: toReadableBookingStatus(booking.status) },
        { label: 'Customer', value: booking.customerName || '-' },
        { label: 'Customer ID', value: booking.customerId },
        { label: 'Phone Number', value: booking.phoneNumber },
        { label: 'Station Name', value: booking.stationName || fulfilment?.pickupStationName },
        { label: 'Station ID', value: booking.stationId },
        { label: 'Vehicle Model', value: booking.vehicleModelName || booking.vehicleModelId },
        { label: 'Vehicle Name', value: booking.vehicleName },
        {
          label: 'Vehicle Registration Number',
          value: booking.vehicleRegisterationNumber || booking.registrationNumber,
        },
        { label: 'Catalogue', value: booking.vehicleCatalogueName || booking.vehicleCatalogueId },
        { label: 'Colour', value: booking.catalogueColorName || booking.catalogueColorId },
        { label: 'Rental Plan', value: booking.rentalPlanName || booking.rentalPlanId },
        { label: 'Ownership Plan', value: booking.ownershipPlanName || booking.ownershipPlanId },
      ]
    : [];

  const procurement = fulfilment?.activeVendorProcurement || null;
  const procurementHistory = Array.isArray(fulfilment?.vendorProcurements)
    ? fulfilment.vendorProcurements
    : procurement
      ? [procurement]
      : [];
  const fulfilmentStatus = Number(fulfilment?.fulfilmentStatus);
  const fulfilmentSource = Number(fulfilment?.fulfilmentSource);
  const showVendorFlowHint = fulfilmentSource === 1 && fulfilmentStatus === 0;
  const showPendingTransitionWarning =
    fulfilmentSource === 1 && fulfilmentStatus === 0 && procurementHistory.length > 0;

  return (
    <>
      <PageHeader
        ghost
        title={fulfilment ? `Fulfilment #${fulfilment.id}` : 'Order Fulfilment'}
        buttons={[
          <div key="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button icon={<FeatherIcon icon="refresh-cw" size={14} />} onClick={refresh}>
              Refresh
            </Button>
            <Button onClick={() => navigate('/admin/order-fulfilment/list')}>Back to Queue</Button>
          </div>,
        ]}
      />
      <Main>
        {loading ? (
          <Cards headless>
            <div className="spin">
              <Spin size="large" />
            </div>
          </Cards>
        ) : !fulfilment ? (
          <Cards headless>
            <Empty
              description="No fulfilment record is available for this booking or ID"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Cards>
        ) : (
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span>Fulfilment Summary</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {statusLabel(fulfilment.fulfilmentStatus)}
                      {sourceLabel(fulfilment.fulfilmentSource)}
                    </div>
                  </div>
                }
              >
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Fulfilment ID">{fulfilment.id}</Descriptions.Item>
                  <Descriptions.Item label="Booking ID">{fulfilment.bookingId}</Descriptions.Item>
                  <Descriptions.Item label="Catalogue">
                    {fulfilment.catalogueName || fulfilment.catalogueId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Colour">
                    {fulfilment.catalogueColorName || fulfilment.catalogueColorId}
                  </Descriptions.Item>
                  <Descriptions.Item label="Vehicle ID">{fulfilment.vehicleId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Pickup Station Name">
                    {booking?.stationName || fulfilment.pickupStationName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Vehicle Station">{fulfilment.vehicleStationName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Expected Delivery">
                    {formatDate(fulfilment.expectedDeliveryDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">{formatDate(fulfilment.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="Updated At">{formatDate(fulfilment.updatedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {formatValue(fulfilment.notes)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card title="Booking Snapshot" style={{ marginTop: 16 }}>
                {bookingSummary.length > 0 ? (
                  <Descriptions bordered column={2} size="small">
                    {bookingSummary.map((item) => (
                      <Descriptions.Item key={item.label} label={item.label}>
                        {formatValue(item.value)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                ) : (
                  <Empty description="Booking details were not loaded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>

              {fulfilmentSource !== 0 && (
                <>
                  <Card title="Current Vendor Procurement" style={{ marginTop: 16 }}>
                    {procurement ? (
                      <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Vendor">{procurement.vendorName}</Descriptions.Item>
                        <Descriptions.Item label="Status">{statusLabel(procurement.status)}</Descriptions.Item>
                        <Descriptions.Item label="Vendor Order Number">
                          {formatValue(procurement.vendorOrderNumber)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cost">{formatValue(procurement.vendorCost)}</Descriptions.Item>
                        <Descriptions.Item label="Confirmed At">
                          {formatDate(procurement.vendorConfirmedAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Dispatch Date">
                          {formatDate(procurement.dispatchDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Delivered At">
                          {formatDate(procurement.deliveredAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Expected Delivery">
                          {formatDate(procurement.expectedDeliveryDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Notes" span={2}>
                          {formatValue(procurement.notes)}
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Empty
                        description="No vendor procurement has been assigned yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>

                  <Card title="Vendor Procurement History" style={{ marginTop: 16 }}>
                    {procurementHistory.length > 0 ? (
                      <Table
                        rowKey={(row) => `${row.id}-${row.vendorId}`}
                        pagination={false}
                        dataSource={procurementHistory}
                        columns={[
                          {
                            title: 'Vendor',
                            render: (_, row) => row.vendorName || row.vendorId || '-',
                          },
                          {
                            title: 'Order No',
                            dataIndex: 'vendorOrderNumber',
                            render: (value) => value || '-',
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            render: (value) => statusLabel(value),
                          },
                          {
                            title: 'Expected Delivery',
                            dataIndex: 'expectedDeliveryDate',
                            render: (value) => formatDate(value),
                          },
                        ]}
                      />
                    ) : (
                      <Empty
                        description="No vendor procurement history available"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </Card>
                </>
              )}
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Available Catalogue Vendors" style={{ marginBottom: 16 }}>
                {availableVendors.length === 0 ? (
                  <Empty description="No active mapped vendors available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {availableVendors.map((vendor) => (
                      <div key={vendor.id} style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 8 }}>
                        <div style={{ fontWeight: 600 }}>{vendor.vendorName}</div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          {vendor.purchasePrice != null
                            ? `₹${Number(vendor.purchasePrice).toLocaleString()}`
                            : 'No default price'}
                          {' • '}
                          {vendor.leadTimeDays != null ? `${vendor.leadTimeDays} days` : 'No lead time'}
                          {' • '}
                          {`Priority ${vendor.priority ?? 0}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Next Action" style={{ marginBottom: 16 }}>
                {showVendorFlowHint && (
                  <Alert
                    style={{ marginBottom: 10 }}
                    type="info"
                    showIcon
                    message="Current state is Pending"
                    description="After Assign Vendor succeeds, this panel will show Confirm Vendor, then Dispatch and Deliver in sequence."
                  />
                )}
                {showPendingTransitionWarning && (
                  <Alert
                    style={{ marginBottom: 10 }}
                    type="warning"
                    showIcon
                    message="Vendor assigned but status still Pending"
                    description="A vendor procurement exists, but fulfilment status did not move to the next step. Please click Refresh and verify backend transition."
                  />
                )}
                {nextAction ? (
                  <>
                    <Badge status="processing" text={getOwnershipActionLabel(nextAction)} />
                    <div style={{ marginTop: 10 }}>
                      <Button
                        type="primary"
                        block
                        disabled={nextAction === 'cancel' && isBookingVehicleAssigned}
                        onClick={() => openAction(nextAction)}
                      >
                        {getOwnershipActionLabel(nextAction)}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Badge status="default" text="No further actions available" />
                )}
              </Card>

              <Card title="Next Actions">
                <div style={{ display: 'grid', gap: 8 }}>
                  {availableActions.length === 0 ? (
                    <Badge status="default" text="No further actions available" />
                  ) : (
                    availableActions.map((action) => (
                      <Button
                        key={action}
                        type="primary"
                        block
                        disabled={action === 'cancel' && isBookingVehicleAssigned}
                        onClick={() => openAction(action)}
                      >
                        {getOwnershipActionLabel(action)}
                      </Button>
                    ))
                  )}
                </div>
              </Card>

              <Card title="Quick Info" style={{ marginTop: 16 }}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Fulfilment Status">
                    {statusLabel(fulfilment.fulfilmentStatus)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fulfilment Source">
                    {sourceLabel(fulfilment.fulfilmentSource)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Booking Link">
                    <Button
                      type="link"
                      onClick={() => navigate(`/admin/booking/detail/${fulfilment.bookingId}`)}
                      style={{ padding: 0 }}
                    >
                      Open booking
                    </Button>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        )}
      </Main>

      <ActionModal
        title={modalState.title}
        visible={modalState.visible}
        fields={modalState.fields}
        confirmText={modalState.confirmText}
        initialValues={modalState.initialValues}
        loading={actionLoading}
        onCancel={closeModal}
        onSubmit={submitAction}
        vendors={availableVendors}
        booking={booking}
        fulfilment={fulfilment}
      />
    </>
  );
}

export default OwnershipFulfilmentDetail;
