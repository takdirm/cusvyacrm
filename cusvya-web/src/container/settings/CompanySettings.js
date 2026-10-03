import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Input, Button, Card, message, Spin, Upload, Divider, DatePicker, Space, Switch } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import FeatherIcon from 'feather-icons-react';
import { Main } from '../styled';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { ProjectHeader } from '../style';
import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api/index';

const INITIAL_VALUES = {
  companyName: 'Scootr Mobility Private Limited',
  address: 'No. 123, 1st Floor, 5th Main, 2nd Cross,',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560093',
  gstNumber: '29ABCDE1234F1Z5',
  email: 'support@scootr.in',
  phoneNumber: '+91 98765 43210',
  website: 'www.scootr.in',
  supportEmail: 'support@scootr.in',
  supportPhoneNumber: '+91 98765 43210',
  supportWhatsAppNumber: '+91 98765 43210',
  emergencyContactNumber: '+91 98765 43210',
  invoicePrefix: 'SCOOTR-INV',
  invoiceStartingNumber: 1,
  bookingPrefix: 'SCOOTR',
  bookingStartingNumber: 1,
  currency: 'INR',
  currencySymbol: '₹',
  timeZone: 'Asia/Kolkata',
  isTaxEnabled: true,
  defaultTaxRate: 0,
  defaultRentalTaxRate: 0,
  invoiceFooter: 'Thank you for choosing Scootr!',
  businessHoursStart: '09:00',
  businessHoursEnd: '20:00',
};

function CompanySettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [authorisedSignatory, setAuthorisedSignatory] = useState(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [authorisedSignatoryUrl, setAuthorisedSignatoryUrl] = useState('');

  const getData = async () => {
    try {
      setLoading(true);
      const response = await DataService.get(API.company.settingsGet);
      const payload = response?.data?.data ?? response?.data ?? {};
      const merged = { ...INITIAL_VALUES, ...payload };

      form.setFieldsValue({
        companyName: merged.companyName || '',
        address: merged.address || '',
        city: merged.city || '',
        state: merged.state || '',
        country: merged.country || 'India',
        pincode: merged.pincode || '',
        gstNumber: merged.gstNumber || '',
        panNumber: merged.panNumber || '',
        cinNumber: merged.cinNumber || '',
        email: merged.email || '',
        phoneNumber: merged.phoneNumber || '',
        website: merged.website || '',
        supportEmail: merged.supportEmail || '',
        supportPhoneNumber: merged.supportPhoneNumber || '',
        supportWhatsAppNumber: merged.supportWhatsAppNumber || '',
        emergencyContactNumber: merged.emergencyContactNumber || '',
        termsAndConditionsUrl: merged.termsAndConditionsUrl || '',
        privacyPolicyUrl: merged.privacyPolicyUrl || '',
        cancellationPolicyUrl: merged.cancellationPolicyUrl || '',
        invoicePrefix: merged.invoicePrefix || 'SCOOTR-INV',
        invoiceStartingNumber: merged.invoiceStartingNumber ?? 1,
        bookingPrefix: merged.bookingPrefix || 'SCOOTR',
        bookingStartingNumber: merged.bookingStartingNumber ?? 1,
        currency: merged.currency || 'INR',
        currencySymbol: merged.currencySymbol || '₹',
        timeZone: merged.timeZone || 'Asia/Kolkata',
        isTaxEnabled: merged.isTaxEnabled ?? true,
        defaultTaxRate: merged.defaultTaxRate ?? 0,
        defaultRentalTaxRate: merged.defaultRentalTaxRate ?? 0,
        invoiceFooter: merged.invoiceFooter || 'Thank you for choosing Scootr!',
        businessHoursStart: merged.businessHoursStart || '09:00',
        businessHoursEnd: merged.businessHoursEnd || '20:00',
      });

      setCompanyLogoUrl(payload.companyLogo || '');
      setAuthorisedSignatoryUrl(payload.authorisedSignatory || '');
    } catch (error) {
      console.error('Error fetching company settings:', error);
      message.error('Failed to fetch company settings');
      form.setFieldsValue(INITIAL_VALUES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSave = async (values) => {
    try {
      setSaving(true);

      const formData = new FormData();
      const normalized = {
        companyName: values.companyName || '',
        address: values.address || '',
        city: values.city || '',
        state: values.state || '',
        country: values.country || 'India',
        pincode: values.pincode || '',
        gstNumber: values.gstNumber || '',
        panNumber: values.panNumber || '',
        cinNumber: values.cinNumber || '',
        email: values.email || '',
        phoneNumber: values.phoneNumber || '',
        website: values.website || '',
        supportEmail: values.supportEmail || '',
        supportPhoneNumber: values.supportPhoneNumber || '',
        supportWhatsAppNumber: values.supportWhatsAppNumber || '',
        emergencyContactNumber: values.emergencyContactNumber || '',
        termsAndConditionsUrl: values.termsAndConditionsUrl || '',
        privacyPolicyUrl: values.privacyPolicyUrl || '',
        cancellationPolicyUrl: values.cancellationPolicyUrl || '',
        invoicePrefix: values.invoicePrefix || 'SCOOTR-INV',
        invoiceStartingNumber: Number(values.invoiceStartingNumber ?? 1),
        bookingPrefix: values.bookingPrefix || 'SCOOTR',
        bookingStartingNumber: Number(values.bookingStartingNumber ?? 1),
        currency: values.currency || 'INR',
        currencySymbol: values.currencySymbol || '₹',
        timeZone: values.timeZone || 'Asia/Kolkata',
        isTaxEnabled: Boolean(values.isTaxEnabled),
        defaultTaxRate: Number(values.defaultTaxRate ?? 0),
        defaultRentalTaxRate: Number(values.defaultRentalTaxRate ?? 0),
        invoiceFooter: values.invoiceFooter || '',
        businessHoursStart: values.businessHoursStart || '09:00',
        businessHoursEnd: values.businessHoursEnd || '20:00',
      };

      Object.entries(normalized).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });

      if (companyLogo instanceof File) {
        formData.append('companyLogoFile', companyLogo);
      }

      if (authorisedSignatory instanceof File) {
        formData.append('authorisedSignatoryFile', authorisedSignatory);
      }

      await DataService.post(API.company.settingsUpdate, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
      });

      message.success('Company settings saved successfully');
      await getData();
    } catch (error) {
      console.error('Error saving company settings:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to save company settings';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const beforeUpload = (file, setter) => {
    setter(file);
    return false;
  };

  const removeFile = (setter, clearUrl) => {
    setter(null);
    clearUrl('');
  };

  const getAssetUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;

    const apiBase = (window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || '')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;

    return apiBase ? `${apiBase}${normalizedPath}` : normalizedPath;
  };

  const renderPreviewImage = (url, label) => {
    if (!url) return <div style={{ color: '#999' }}>{label} not uploaded</div>;
    return (
      <img
        src={getAssetUrl(url)}
        alt={label}
        style={{ maxWidth: 180, maxHeight: 80, objectFit: 'contain', border: '1px solid #f0f0f0', borderRadius: 6 }}
      />
    );
  };

  if (loading) {
    return (
      <Main>
        <PageHeader ghost title="Company Settings" subTitle="Manage company profile and document letterhead" />
        <ProjectHeader>
          <Cards headless>
            <div className="spin" style={{ minHeight: 300 }}>
              <Spin size="large" />
            </div>
          </Cards>
        </ProjectHeader>
      </Main>
    );
  }

  return (
    <Main>
      <PageHeader
        ghost
        title="Company Settings"
        subTitle="Manage company profile, branding, and letterhead data"
        buttons={[
          <Button key="back" onClick={() => window.history.back()} type="default">
            <FeatherIcon icon="arrow-left" size={14} /> Back
          </Button>,
        ]}
      />

      <ProjectHeader>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Cards title="Company Details">
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="companyName"
                      label="Company Name"
                      rules={[{ required: true, message: 'Company name is required' }]}
                    >
                      <Input placeholder="Scootr Mobility Private Limited" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label="Email">
                      <Input placeholder="support@scootr.in" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="phoneNumber" label="Phone Number">
                      <Input placeholder="+91 98765 43210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="website" label="Website">
                      <Input placeholder="www.scootr.in" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="address" label="Address">
                      <Input.TextArea rows={3} placeholder="Street address" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="city" label="City">
                      <Input placeholder="Bengaluru" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="state" label="State">
                      <Input placeholder="Karnataka" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="country" label="Country">
                      <Input placeholder="India" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="pincode" label="Pincode">
                      <Input placeholder="560093" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="gstNumber" label="GST Number">
                      <Input placeholder="29ABCDE1234F1Z5" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="panNumber" label="PAN Number">
                      <Input placeholder="ABCDE1234F" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="cinNumber" label="CIN Number">
                      <Input placeholder="U74900KA2024PTC000000" />
                    </Form.Item>
                  </Col>
                </Row>
              </Cards>
            </Col>

            <Col xs={24} lg={8}>
              <Cards title="Brand Assets">
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>Company Logo</div>
                    <div style={{ marginBottom: 8, color: '#666' }}>Recommended size: 300 x 80 px</div>
                    {renderPreviewImage(companyLogoUrl, 'Company Logo')}
                    <Upload
                      accept="image/*"
                      beforeUpload={(file) => beforeUpload(file, setCompanyLogo)}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />}>Upload logo</Button>
                    </Upload>
                    {companyLogo && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(setCompanyLogo, setCompanyLogoUrl)}
                      >
                        Remove new logo
                      </Button>
                    )}
                  </Col>

                  <Col xs={24}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>Authorised Signatory</div>
                    <div style={{ marginBottom: 8, color: '#666' }}>Recommended size: 300 x 120 px</div>
                    {renderPreviewImage(authorisedSignatoryUrl, 'Authorised Signatory')}
                    <Upload
                      accept="image/*"
                      beforeUpload={(file) => beforeUpload(file, setAuthorisedSignatory)}
                      showUploadList={false}
                    >
                      <Button icon={<UploadOutlined />}>Upload signature</Button>
                    </Upload>
                    {authorisedSignatory && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(setAuthorisedSignatory, setAuthorisedSignatoryUrl)}
                      >
                        Remove new signature
                      </Button>
                    )}
                  </Col>
                </Row>
              </Cards>
            </Col>

            <Col xs={24}>
              <Cards title="Support & Policy">
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="supportEmail" label="Support Email">
                      <Input placeholder="support@scootr.in" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="supportPhoneNumber" label="Support Phone Number">
                      <Input placeholder="+91 98765 43210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="supportWhatsAppNumber" label="Support WhatsApp Number">
                      <Input placeholder="+91 98765 43210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="emergencyContactNumber" label="Emergency Contact Number">
                      <Input placeholder="+91 98765 43210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="termsAndConditionsUrl" label="Terms & Conditions URL">
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="privacyPolicyUrl" label="Privacy Policy URL">
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="cancellationPolicyUrl" label="Cancellation Policy URL">
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="invoicePrefix" label="Invoice Prefix">
                      <Input placeholder="SCOOTR-INV" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="invoiceStartingNumber" label="Invoice Start #">
                      <Input type="number" min={1} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="bookingPrefix" label="Booking Prefix">
                      <Input placeholder="SCOOTR" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="bookingStartingNumber" label="Booking Start #">
                      <Input type="number" min={1} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="currency" label="Currency">
                      <Input placeholder="INR" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="currencySymbol" label="Currency Symbol">
                      <Input placeholder="₹" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="timeZone" label="Time Zone">
                      <Input placeholder="Asia/Kolkata" />
                    </Form.Item>
                  </Col>
                </Row>
              </Cards>
            </Col>

            <Col xs={24}>
              <Cards title="Tax & Business Hours">
                <Row gutter={16}>
                  <Col xs={24} sm={4}>
                    <Form.Item name="isTaxEnabled" label="Tax Enabled" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="defaultTaxRate" label="Default Tax Rate">
                      <Input type="number" step="0.01" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={4}>
                    <Form.Item name="defaultRentalTaxRate" label="Rental Tax Rate">
                      <Input type="number" step="0.01" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="businessHoursStart" label="Business Hours Start">
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="businessHoursEnd" label="Business Hours End">
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="invoiceFooter" label="Invoice Footer">
                      <Input.TextArea rows={3} placeholder="Footer text to print on invoices" />
                    </Form.Item>
                  </Col>
                </Row>
              </Cards>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Company Settings
            </Button>
            <Button onClick={() => getData()}>Reset</Button>
          </Space>
        </Form>
      </ProjectHeader>
    </Main>
  );
}

export default CompanySettings;
