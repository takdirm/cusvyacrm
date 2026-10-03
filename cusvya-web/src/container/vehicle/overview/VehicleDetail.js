import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Divider, Empty, message, Modal } from 'antd';
import PlainLabel from '../../../components/labels/plain-label';
import FeatherIcon from 'feather-icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import axios from 'axios';
import { PageHeader } from '../../../components/page-headers/page-headers';
import { Cards } from '../../../components/cards/frame/cards-frame';
import { Main } from '../../styled';
import { Button } from '../../../components/buttons/buttons';
import GoogleMapsSimple from '../../../components/maps/GoogleMapsSimple';
import { API } from '../../../config/api/index';
import { getItem } from '../../../utility/localStorageControl';
import {
  getVehicleCategoryText,
  getVehicleTypeText,
  getOwnershipStatusText,
  getVehicleListingStatusText,
  getVehicleServiceTypeText,
} from '../../../config/enum/enum';

const VEHICLE_DOCUMENT_TYPES = [
  { value: 3, label: 'Vehicle Registration' },
  { value: 4, label: 'Pollution Certificate' },
  { value: 5, label: 'Insurance' },
  { value: 6, label: 'Battery Warranty Card' },
  { value: 99, label: 'Others' },
];

const DOCUMENT_SIDE_OPTIONS = [
  { value: 1, label: 'Front' },
  { value: 2, label: 'Back' },
];

const getBikeConditionText = (value) => {
  const labels = ['New', 'Like New', 'Good', 'Fair', 'Poor', 'Very Poor'];
  const normalized = Number(value);
  if (Number.isNaN(normalized)) return '-';
  return labels[normalized] || '-';
};

const boolTag = (val) =>
  val ? <PlainLabel color="success">Yes</PlainLabel> : <PlainLabel color="default">No</PlainLabel>;

const infoItem = (label, value) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontWeight: 600, color: '#666', fontSize: 12 }}>{label}</span>
    <div style={{ fontSize: 14, marginTop: 2 }}>{value ?? '-'}</div>
  </div>
);

function VehicleDetail() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [docType, setDocType] = useState(3);
  const [docSide, setDocSide] = useState(1);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => {
    let apiUrl =
      window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
    if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
    return apiUrl;
  };

  const getDocumentTypeText = (documentType) => {
    const type = Number(documentType);
    if (type === 3) return 'Vehicle Registration';
    if (type === 4) return 'Pollution Certificate';
    if (type === 5) return 'Insurance';
    if (type === 6) return 'Battery Warranty Card';
    if (type === 99) return 'Others';
    return `Type ${documentType}`;
  };

  const getDocumentSideText = (side) => {
    if (Number(side) === 1) return 'Front';
    if (Number(side) === 2) return 'Back';
    return 'Unknown';
  };

  const buildDocumentUrl = (filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `${getApiUrl()}/${String(filePath).replace(/^\/+/, '')}`;
  };

  const isImageDocument = (doc) => {
    const format = Number(doc?.fileFormat);
    if (format === 2 || format === 3) return true;
    const path = String(doc?.filePath || '').toLowerCase();
    return path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg');
  };

  const refreshDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.document.path}/vehicle/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to refresh documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    Modal.confirm({
      title: 'Delete Document',
      content: 'Are you sure you want to delete this document?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeletingDocumentId(documentId);
          const token = getItem('access_token');
          const apiUrl = getApiUrl();
          await axios.delete(`${apiUrl}/api${API.document.path}/${documentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          message.success('Document deleted successfully');
          await refreshDocuments();
        } catch (error) {
          message.error(error?.response?.data?.message || error?.message || 'Failed to delete document');
        } finally {
          setDeletingDocumentId(null);
        }
      },
    });
  };

  const handleDownloadDocument = async (documentId, originalFileName) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.document.path}/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = originalFileName || `document_${documentId}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to download document');
    }
  };

  const handlePrintDocument = async (documentId) => {
    try {
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const response = await axios.get(`${apiUrl}/api${API.document.path}/${documentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const sourceBlob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const pdfBytes = await sourceBlob.arrayBuffer();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      const iframe = window.document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            iframe.remove();
          }, 10000);
        }
      };

      iframe.onerror = () => {
        window.URL.revokeObjectURL(blobUrl);
        iframe.remove();
        message.error('Failed to load document for printing');
      };

      iframe.src = blobUrl;
      window.document.body.appendChild(iframe);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to print document');
    }
  };

  const handleDocumentsOpen = () => {
    setDocType(3);
    setDocSide(1);
    setDocName('');
    setDocDescription('');
    setDocFile(null);
    setDocumentsModalVisible(true);
  };

  const handleDocumentsClose = () => {
    if (docUploading) return;
    setDocumentsModalVisible(false);
  };

  const handleDocFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setDocFile(null);
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes((selected.type || '').toLowerCase())) {
      message.error('Only PDF, JPEG and PNG files are allowed');
      event.target.value = '';
      setDocFile(null);
      return;
    }

    setDocFile(selected);
  };

  const handleUploadDocument = async () => {
    if (!vehicle?.id) {
      message.error('Vehicle is required');
      return;
    }

    if (!docFile) {
      message.error('Please choose a file to upload');
      return;
    }

    if (Number(docType) === 99 && !docName.trim()) {
      message.error('Document Name is required when Document Type is Others');
      return;
    }

    const documentTypeLabel =
      VEHICLE_DOCUMENT_TYPES.find((item) => item.value === Number(docType))?.label || 'Document';
    const effectiveName = Number(docType) === 99 ? docName.trim() : documentTypeLabel;

    try {
      setDocUploading(true);
      const token = getItem('access_token');
      const apiUrl = getApiUrl();
      const formData = new FormData();
      formData.append('documentType', Number(docType));
      formData.append('side', Number(docSide));
      formData.append('name', effectiveName);
      formData.append('description', docDescription?.trim() || '');
      formData.append('file', docFile);

      await axios.post(`${apiUrl}/api${API.document.path}/vehicle/${vehicle.id}`, formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Vehicle document uploaded successfully');
      handleDocumentsClose();
      await refreshDocuments();
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to upload vehicle document');
    } finally {
      setDocUploading(false);
    }
  };

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      setDocumentsLoading(true);
      try {
        const token = getItem('access_token');
        const apiUrl = getApiUrl();
        const [vehicleResponse, documentResponse] = await Promise.all([
          axios.get(`${apiUrl}/api${API.vehicle.path}/${vehicleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}/api${API.document.path}/vehicle/${vehicleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setVehicle(vehicleResponse.data);
        setDocuments(Array.isArray(documentResponse.data) ? documentResponse.data : []);
      } catch (error) {
        console.error('Failed to fetch vehicle:', error);
      } finally {
        setLoading(false);
        setDocumentsLoading(false);
      }
    };
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="spin" style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <Main>
        <Empty description="Vehicle not found" />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="primary" onClick={() => navigate('/admin/vehicle/list')}>
            Back to Vehicles
          </Button>
        </div>
      </Main>
    );
  }

  const hasLocation =
    vehicle.lastLatitude != null &&
    vehicle.lastLongitude != null &&
    parseFloat(vehicle.lastLatitude) !== 0 &&
    parseFloat(vehicle.lastLongitude) !== 0;

  return (
    <>
      <PageHeader
        ghost
        title={`Vehicle: ${vehicle.name || vehicle.uID || vehicleId}`}
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="white" outlined onClick={() => navigate('/admin/vehicle/list')}>
              <FeatherIcon icon="arrow-left" size={14} /> Back
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Row gutter={[24, 24]}>
          {/* Left column: Image + Location Map */}
          <Col xs={24} lg={8}>
            <Cards title="Image" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.name}
                  style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 220 }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 180,
                    background: '#f5f5f5',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FeatherIcon icon="image" size={40} color="#ccc" />
                </div>
              )}
              {vehicle.videoUrl && (
                <a
                  href={vehicle.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 12, textAlign: 'center' }}
                >
                  <FeatherIcon icon="play-circle" size={14} /> Watch Video
                </a>
              )}
            </Cards>

            <Cards
              title="Last Known Location"
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
              style={{ marginTop: 0 }}
            >
              {hasLocation ? (
                <>
                  <GoogleMapsSimple
                    latitude={vehicle.lastLatitude}
                    longitude={vehicle.lastLongitude}
                    height="250px"
                    zoom={15}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                    <FeatherIcon icon="map-pin" size={12} /> Lat: {vehicle.lastLatitude}, Lng: {vehicle.lastLongitude}
                  </div>
                </>
              ) : (
                <Empty description="No location data available" />
              )}
            </Cards>
          </Col>

          {/* Right column: Details */}
          <Col xs={24} lg={16}>
            <Cards title="Basic Information" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 0]}>
                <Col xs={12} sm={8}>
                  {infoItem('UID', vehicle.uid || vehicle.uID || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Name', vehicle.name || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Vehicle Model',
                    vehicle.vehicleModel?.name ? (
                      <PlainLabel color="blue">{vehicle.vehicleModel.name}</PlainLabel>
                    ) : (
                      '-'
                    ),
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Vehicle Category',
                    vehicle.vehicleCategory != null ? (
                      <PlainLabel color="purple">{getVehicleCategoryText(vehicle.vehicleCategory)}</PlainLabel>
                    ) : (
                      '-'
                    ),
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Vehicle Type',
                    vehicle.vehicleType != null ? (
                      <PlainLabel color="cyan">{getVehicleTypeText(vehicle.vehicleType)}</PlainLabel>
                    ) : (
                      '-'
                    ),
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Ownership Status',
                    vehicle.ownershipStatus != null ? (
                      <PlainLabel color="orange">{getOwnershipStatusText(vehicle.ownershipStatus)}</PlainLabel>
                    ) : (
                      '-'
                    ),
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Listing Status',
                    vehicle.vehicleListingStatus != null ? (
                      <PlainLabel color="geekblue">
                        {getVehicleListingStatusText(vehicle.vehicleListingStatus)}
                      </PlainLabel>
                    ) : (
                      '-'
                    ),
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Manufacturer', vehicle.manufacturer || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Top Speed', vehicle.vehicleModel?.topSpeed || vehicle.topSpeed || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Range', vehicle.range || vehicle.vehicleModel?.range || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Model Year', vehicle.modelYear ?? '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Condition', getBikeConditionText(vehicle.bikeCondition))}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Km Driven', vehicle.kmDriven != null ? vehicle.kmDriven.toLocaleString() : '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Registration No.', vehicle.registerationNumber || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Chassis No.', vehicle.chassisNumber || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Warranty Period', vehicle.warrantyPeriod || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Tracker IMEI', vehicle.trackerDevice?.imei || '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Vehicle Catalogue',
                    vehicle.vehicleCatalogue
                      ? `${vehicle.vehicleCatalogue.brand || ''} ${vehicle.vehicleCatalogue.model || ''}`.trim() || '-'
                      : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Created At',
                    vehicle.createdAt ? moment(vehicle.createdAt).format('YYYY-MM-DD HH:mm') : '-',
                  )}
                </Col>
              </Row>
            </Cards>

            <Cards title="Pricing" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 0]}>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Cost Price',
                    vehicle.costPrice != null ? `₹${Number(vehicle.costPrice).toLocaleString()}` : '-',
                  )}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Sale Price', vehicle.price != null ? `₹${Number(vehicle.price).toLocaleString()}` : '-')}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem(
                    'Accrued Earnings',
                    vehicle.accruedEarnings != null ? `₹${Number(vehicle.accruedEarnings).toLocaleString()}` : '-',
                  )}
                </Col>
              </Row>
            </Cards>

            {/* Vehicle Model Details */}
            {vehicle.vehicleModel && (
              <Cards title="Vehicle Model Details" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                <Row gutter={[16, 0]}>
                  {vehicle.vehicleModel.imageUrl && (
                    <Col xs={24} sm={6} style={{ marginBottom: 12 }}>
                      <img
                        src={vehicle.vehicleModel.imageUrl}
                        alt={vehicle.vehicleModel.name}
                        style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 120 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </Col>
                  )}
                  <Col xs={24} sm={vehicle.vehicleModel.imageUrl ? 18 : 24}>
                    <Row gutter={[16, 0]}>
                      <Col xs={12} sm={8}>
                        {infoItem('Model Name', <PlainLabel color="blue">{vehicle.vehicleModel.name}</PlainLabel>)}
                      </Col>
                      <Col xs={12} sm={8}>
                        {infoItem(
                          'Top Speed',
                          vehicle.vehicleModel.topSpeed ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FeatherIcon icon="zap" size={12} color="#faad14" />
                              {vehicle.vehicleModel.topSpeed}
                            </span>
                          ) : (
                            '-'
                          ),
                        )}
                      </Col>
                      <Col xs={12} sm={8}>
                        {infoItem(
                          'Range',
                          vehicle.vehicleModel.range ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FeatherIcon icon="battery-charging" size={12} color="#52c41a" />
                              {vehicle.vehicleModel.range}
                            </span>
                          ) : (
                            '-'
                          ),
                        )}
                      </Col>
                      <Col xs={12} sm={8}>
                        {infoItem(
                          'Service Type',
                          vehicle.vehicleModel.vehicleServiceType != null
                            ? getVehicleServiceTypeText(vehicle.vehicleModel.vehicleServiceType)
                            : '-',
                        )}
                      </Col>
                      {vehicle.vehicleModel.basePrice != null && (
                        <Col xs={12} sm={8}>
                          {infoItem('Base Price', `₹${Number(vehicle.vehicleModel.basePrice).toLocaleString()}`)}
                        </Col>
                      )}
                      {vehicle.vehicleModel.rentalPriceStarts != null && (
                        <Col xs={12} sm={8}>
                          {infoItem(
                            'Rental From',
                            `₹${Number(vehicle.vehicleModel.rentalPriceStarts).toLocaleString()}`,
                          )}
                        </Col>
                      )}
                      {vehicle.vehicleModel.ownershipPriceStarts != null && (
                        <Col xs={12} sm={8}>
                          {infoItem(
                            'Ownership From',
                            `₹${Number(vehicle.vehicleModel.ownershipPriceStarts).toLocaleString()}`,
                          )}
                        </Col>
                      )}
                    </Row>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <PlainLabel color={vehicle.vehicleModel.isPetrolEngine ? 'orange' : 'default'}>
                        <FeatherIcon icon="droplet" size={10} style={{ marginRight: 4 }} />
                        {vehicle.vehicleModel.isPetrolEngine ? 'Petrol' : 'Electric'}
                      </PlainLabel>
                      <PlainLabel color={vehicle.vehicleModel.isLicenseRequired ? 'warning' : 'default'}>
                        <FeatherIcon icon="credit-card" size={10} style={{ marginRight: 4 }} />
                        License {vehicle.vehicleModel.isLicenseRequired ? 'Required' : 'Not Required'}
                      </PlainLabel>
                      <PlainLabel color={vehicle.vehicleModel.isNew ? 'blue' : 'default'}>
                        <FeatherIcon icon="star" size={10} style={{ marginRight: 4 }} />
                        {vehicle.vehicleModel.isNew ? 'New' : 'Used'}
                      </PlainLabel>
                    </div>
                  </Col>
                </Row>
              </Cards>
            )}

            <Cards title="Status" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={8}>
                  {infoItem('Active', boolTag(vehicle.isActive))}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Certified', boolTag(vehicle.isCertified))}
                </Col>
                <Col xs={12} sm={8}>
                  {infoItem('Tracker Assigned', boolTag(Boolean(vehicle.trackerDevice?.id)))}
                </Col>
              </Row>
            </Cards>

            {vehicle.features && vehicle.features.length > 0 && (
              <Cards title="Features" headStyle={{ borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {vehicle.features.map((f, i) => (
                    <PlainLabel key={i} color="geekblue">
                      {f.name || f.feature || JSON.stringify(f)}
                    </PlainLabel>
                  ))}
                </div>
              </Cards>
            )}
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Cards
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Documents</span>
                  <Button size="small" type="primary" onClick={handleDocumentsOpen}>
                    <FeatherIcon icon="plus" size={14} /> Add Document
                  </Button>
                </div>
              }
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
            >
              {documentsLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin />
                </div>
              ) : documents.length === 0 ? (
                <Empty description="No documents uploaded" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Row gutter={[16, 16]}>
                  {documents.map((doc) => {
                    const documentUrl = buildDocumentUrl(doc.filePath);
                    const isImage = isImageDocument(doc);
                    const isDeleting = deletingDocumentId === doc.id;

                    return (
                      <Col xs={24} sm={12} lg={8} key={doc.id}>
                        <div
                          style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            padding: 12,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{doc.name || getDocumentTypeText(doc.documentType)}</div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            Type: {getDocumentTypeText(doc.documentType)} | Side: {getDocumentSideText(doc.side)}
                          </div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            Uploaded: {doc.createdAt ? moment(doc.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                          </div>

                          {isImage && documentUrl ? (
                            <img
                              src={documentUrl}
                              alt={doc.name || `Document ${doc.id}`}
                              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 6 }}
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                height: 180,
                                borderRadius: 6,
                                background: '#fafafa',
                                border: '1px dashed #d9d9d9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                              }}
                            >
                              <FeatherIcon icon="file-text" size={20} />
                              <span style={{ marginLeft: 8 }}>Preview not available</span>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleDownloadDocument(doc.id, doc.originalFileName)}
                            >
                              Download
                            </Button>
                            <Button size="small" type="default" outlined onClick={() => handlePrintDocument(doc.id)}>
                              Print
                            </Button>
                            <Button
                              size="small"
                              type="danger"
                              outlined
                              loading={isDeleting}
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Cards>
          </Col>
        </Row>
      </Main>

      <Modal
        open={documentsModalVisible}
        onCancel={handleDocumentsClose}
        onOk={handleUploadDocument}
        okText="Upload"
        confirmLoading={docUploading}
        title={vehicle ? `Upload Documents - ${vehicle.name || `#${vehicle.id}`}` : 'Upload Documents'}
        destroyOnClose
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Type</label>
            <select
              value={docType}
              onChange={(event) => setDocType(Number(event.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            >
              {VEHICLE_DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {Number(docType) === 99 && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Document Name</label>
              <input
                type="text"
                value={docName}
                onChange={(event) => setDocName(event.target.value)}
                placeholder="Enter custom document name"
                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Side</label>
            <select
              value={docSide}
              onChange={(event) => setDocSide(Number(event.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            >
              {DOCUMENT_SIDE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Description (Optional)</label>
            <textarea
              value={docDescription}
              onChange={(event) => setDocDescription(event.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Choose File (PDF/JPEG/PNG)</label>
            <input type="file" accept=".pdf,.jpeg,.jpg,.png" onChange={handleDocFileChange} />
            {docFile && <div style={{ marginTop: 8, color: '#666' }}>Selected: {docFile.name}</div>}
          </div>
        </div>
      </Modal>
    </>
  );
}

export default VehicleDetail;
