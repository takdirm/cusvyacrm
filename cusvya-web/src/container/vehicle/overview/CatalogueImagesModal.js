import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Row, Col, Empty, Form, Input, InputNumber, Switch, Upload, message, Spin, Divider, Space } from 'antd';
import PropTypes from 'prop-types';
import FeatherIcon from 'feather-icons-react';
import { Button } from '../../../components/buttons/buttons';
import PlainLabel from '../../../components/labels/plain-label';
import {
  createCatalogueColor,
  deleteCatalogueColor,
  deleteCatalogueColorImage,
  extractMessage,
  getCatalogueColorImages,
  getCatalogueColors,
  updateCatalogueColor,
  updateCatalogueColorImage,
  uploadCatalogueColorImages,
} from './services/catalogueMediaService';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const SUPPORTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];

const getApiBaseUrl = () => {
  let apiUrl =
    window.runtimeConfig?.REACT_APP_API_ENDPOINT || process.env.REACT_APP_API_ENDPOINT || 'http://localhost:4080';
  if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
  if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);
  return apiUrl;
};

const toAssetUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

function CatalogueImagesModal({ visible, catalogue, onCancel }) {
  const [colorForm] = Form.useForm();

  const [loadingColors, setLoadingColors] = useState(false);
  const [colors, setColors] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [savingColor, setSavingColor] = useState(false);
  const [deletingColor, setDeletingColor] = useState(false);

  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const [updatingPrimaryId, setUpdatingPrimaryId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [displayOrderDrafts, setDisplayOrderDrafts] = useState({});

  const selectedColor = useMemo(
    () => colors.find((color) => Number(color.id) === Number(selectedColorId)) || null,
    [colors, selectedColorId],
  );

  const isAddColorMode = !selectedColor;

  const resetState = () => {
    colorForm.resetFields();
    setColors([]);
    setSelectedColorId(null);
    setImages([]);
    setPendingFiles([]);
    setDisplayOrderDrafts({});
    setUpdatingPrimaryId(null);
    setUpdatingOrderId(null);
    setDeletingImageId(null);
  };

  const loadColors = async (preferredColorId = null) => {
    if (!catalogue?.id) return;

    setLoadingColors(true);
    try {
      const loadedColors = await getCatalogueColors(catalogue.id);
      setColors(Array.isArray(loadedColors) ? loadedColors : []);

      if (!loadedColors?.length) {
        setSelectedColorId(null);
        colorForm.setFieldsValue({
          colorName: '',
          colorCode: '#000000',
          isAvailable: true,
        });
        setImages([]);
        return;
      }

      const nextSelectedId =
        preferredColorId && loadedColors.some((c) => Number(c.id) === Number(preferredColorId))
          ? preferredColorId
          : selectedColorId && loadedColors.some((c) => Number(c.id) === Number(selectedColorId))
            ? selectedColorId
            : loadedColors[0].id;

      setSelectedColorId(nextSelectedId);
    } catch (error) {
      message.error(extractMessage(error, 'Failed to load catalogue colors'));
      setColors([]);
      setSelectedColorId(null);
      setImages([]);
    } finally {
      setLoadingColors(false);
    }
  };

  const loadImages = async (colorIdToLoad) => {
    if (!catalogue?.id || !colorIdToLoad) {
      setImages([]);
      return;
    }

    setLoadingImages(true);
    try {
      const loadedImages = await getCatalogueColorImages(catalogue.id, colorIdToLoad);
      setImages(Array.isArray(loadedImages) ? loadedImages : []);
    } catch (error) {
      message.error(extractMessage(error, 'Failed to load color images'));
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    if (!visible || !catalogue?.id) {
      resetState();
      return;
    }

    loadColors();
  }, [visible, catalogue?.id]);

  useEffect(() => {
    if (!selectedColor) {
      colorForm.setFieldsValue({
        colorName: '',
        colorCode: '#000000',
        isAvailable: true,
      });
      setImages([]);
      return;
    }

    colorForm.setFieldsValue({
      colorName: selectedColor.colorName,
      colorCode: selectedColor.colorCode,
      isAvailable: selectedColor.isAvailable,
    });

    loadImages(selectedColor.id);
  }, [selectedColor?.id]);

  useEffect(() => {
    setDisplayOrderDrafts(
      images.reduce((acc, image) => {
        acc[image.id] = image.displayOrder;
        return acc;
      }, {}),
    );
  }, [images]);

  const handleSelectColor = (colorId) => {
    setSelectedColorId(colorId);
    setPendingFiles([]);
  };

  const handleAddColorMode = () => {
    setSelectedColorId(null);
    colorForm.setFieldsValue({
      colorName: '',
      colorCode: '#000000',
      isAvailable: true,
    });
    setPendingFiles([]);
  };

  const handleSaveColor = async () => {
    if (!catalogue?.id) return;

    try {
      const values = await colorForm.validateFields();
      const payload = {
        colorName: values.colorName?.trim(),
        colorCode: values.colorCode?.trim(),
        isAvailable: Boolean(values.isAvailable),
      };

      setSavingColor(true);
      if (selectedColor) {
        await updateCatalogueColor(catalogue.id, selectedColor.id, payload);
        message.success('Color updated successfully');
        await loadColors(selectedColor.id);
      } else {
        const created = await createCatalogueColor(catalogue.id, payload);
        message.success('Color added successfully');
        await loadColors(created?.id || null);
      }
    } catch (error) {
      if (error?.errorFields) {
        message.error('Please provide valid color details');
      } else {
        message.error(extractMessage(error, 'Failed to save color'));
      }
    } finally {
      setSavingColor(false);
    }
  };

  const handleDeleteColor = () => {
    if (!selectedColor || !catalogue?.id) return;

    Modal.confirm({
      title: 'Delete Color',
      content: `Are you sure you want to delete ${selectedColor.colorName}?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeletingColor(true);
          await deleteCatalogueColor(catalogue.id, selectedColor.id);
          message.success('Color deleted successfully');
          await loadColors();
        } catch (error) {
          message.error(extractMessage(error, 'Failed to delete color'));
        } finally {
          setDeletingColor(false);
        }
      },
    });
  };

  const beforeUpload = (file) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      message.error('Only PNG, JPG/JPEG, WEBP, MP4, MOV and WEBM files are supported.');
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      message.error('Each file must be 25 MB or smaller.');
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleUploadImages = async () => {
    if (!catalogue?.id || !selectedColor?.id) {
      message.error('Please select a color before uploading media.');
      return;
    }

    if (!pendingFiles.length) {
      message.error('Please select at least one media file.');
      return;
    }

    const files = pendingFiles.map((file) => file.originFileObj).filter(Boolean);
    if (!files.length) {
      message.error('Please select valid media files.');
      return;
    }

    try {
      setUploadingImages(true);
      await uploadCatalogueColorImages(catalogue.id, selectedColor.id, files);
      message.success('Media uploaded successfully');
      setPendingFiles([]);
      await loadImages(selectedColor.id);
    } catch (error) {
      message.error(extractMessage(error, 'Failed to upload images'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!catalogue?.id || !selectedColor?.id) return;

    try {
      setUpdatingPrimaryId(imageId);
      await updateCatalogueColorImage(catalogue.id, selectedColor.id, imageId, { isPrimary: true });
      message.success('Primary image updated');
      await loadImages(selectedColor.id);
    } catch (error) {
      message.error(extractMessage(error, 'Failed to set primary image'));
    } finally {
      setUpdatingPrimaryId(null);
    }
  };

  const handleSaveDisplayOrder = async (imageId) => {
    if (!catalogue?.id || !selectedColor?.id) return;

    const value = Number(displayOrderDrafts[imageId]);
    if (!Number.isFinite(value) || value < 0) {
      message.error('Display order must be 0 or greater.');
      return;
    }

    try {
      setUpdatingOrderId(imageId);
      await updateCatalogueColorImage(catalogue.id, selectedColor.id, imageId, { displayOrder: value });
      message.success('Display order updated');
      await loadImages(selectedColor.id);
    } catch (error) {
      message.error(extractMessage(error, 'Failed to update display order'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteImage = (image) => {
    if (!catalogue?.id || !selectedColor?.id) return;

    Modal.confirm({
      title: 'Delete Image',
      content: 'Delete this image?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setDeletingImageId(image.id);
          await deleteCatalogueColorImage(catalogue.id, selectedColor.id, image.id);
          message.success('Image deleted successfully');
          await loadImages(selectedColor.id);
        } catch (error) {
          message.error(extractMessage(error, 'Failed to delete image'));
        } finally {
          setDeletingImageId(null);
        }
      },
    });
  };

  return (
    <Modal
      title={`Manage Varient${catalogue?.name ? ` - ${catalogue.name}` : ''}`}
      open={visible}
      onCancel={onCancel}
      width={1160}
      destroyOnHidden
      footer={[
        <Button key="close" type="white" outlined onClick={onCancel}>
          Close
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Catalogue: {catalogue?.name || '-'}</div>
        <div style={{ color: '#666', marginTop: 4 }}>
          Ex-showroom Price:{' '}
          {catalogue?.exShowroomPrice != null ? `₹${Number(catalogue.exShowroomPrice).toLocaleString()}` : '-'}
        </div>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={9}>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
              minHeight: 460,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>Colors</h4>
              <Button size="small" type="primary" onClick={handleAddColorMode}>
                + Add Color
              </Button>
            </div>

            {loadingColors ? (
              <div className="spin" style={{ minHeight: 120 }}>
                <Spin size="small" />
              </div>
            ) : colors.length === 0 ? (
              <Empty description="No colors have been added yet." />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {colors.map((color) => {
                  const isSelected = Number(color.id) === Number(selectedColorId);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleSelectColor(color.id)}
                      style={{
                        border: isSelected ? '1px solid #1677ff' : '1px solid #d9d9d9',
                        background: isSelected ? '#e6f4ff' : '#fff',
                        borderRadius: 999,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          border: '1px solid #ddd',
                          background: color.colorCode || '#fff',
                        }}
                      />
                      <span>{color.colorName}</span>
                      {color.isAvailable ? (
                        <PlainLabel color="success">Available</PlainLabel>
                      ) : (
                        <PlainLabel color="default">Unavailable</PlainLabel>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            <Form form={colorForm} layout="vertical" autoComplete="off">
              <Form.Item
                name="colorName"
                label="Color Name"
                rules={[{ required: true, message: 'Color name is required' }]}
              >
                <Input placeholder="Racing Red" />
              </Form.Item>

              <Form.Item
                name="colorCode"
                label="Color Code"
                rules={[
                  { required: true, message: 'Color code is required' },
                  { pattern: /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, message: 'Use HEX format like #FF0000' },
                ]}
              >
                <Input
                  placeholder="#FF0000"
                  addonAfter={
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const value = colorForm.getFieldValue('colorCode') || '#ffffff';
                        return (
                          <input
                            aria-label="Pick color"
                            type="color"
                            value={/^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value) ? value : '#ffffff'}
                            onChange={(event) => {
                              colorForm.setFieldsValue({ colorCode: event.target.value.toUpperCase() });
                            }}
                            style={{
                              width: 36,
                              height: 24,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                            }}
                          />
                        );
                      }}
                    </Form.Item>
                  }
                />
              </Form.Item>

              <Form.Item name="isAvailable" label="Available" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>

              <Space>
                <Button type="primary" onClick={handleSaveColor} disabled={savingColor || loadingColors}>
                  {savingColor ? 'Saving...' : isAddColorMode ? 'Add Color' : 'Save Color'}
                </Button>
                {!isAddColorMode && (
                  <Button
                    type="white"
                    outlined
                    danger
                    onClick={handleDeleteColor}
                    disabled={deletingColor || savingColor}
                  >
                    {deletingColor ? 'Deleting...' : 'Delete Color'}
                  </Button>
                )}
              </Space>
            </Form>
          </div>
        </Col>

        <Col xs={24} md={15}>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 12,
              minHeight: 460,
              background: '#fff',
            }}
          >
            <h4 style={{ marginTop: 0 }}>Media</h4>

            {selectedColor ? (
              <>
                <Upload
                  multiple
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm,video/x-m4v"
                  listType="picture"
                  fileList={pendingFiles}
                  beforeUpload={beforeUpload}
                  onChange={({ fileList }) => setPendingFiles(fileList)}
                  onRemove={(file) => {
                    setPendingFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                  }}
                >
                  <Button size="small" type="white" outlined>
                    <FeatherIcon icon="upload" size={14} /> Select Media
                  </Button>
                </Upload>

                <div style={{ marginTop: 10, marginBottom: 16 }}>
                  <Button
                    type="primary"
                    onClick={handleUploadImages}
                    disabled={uploadingImages || !pendingFiles.length || loadingImages}
                  >
                    {uploadingImages ? 'Uploading...' : 'Upload Media'}
                  </Button>
                </div>

                {loadingImages ? (
                  <div className="spin" style={{ minHeight: 120 }}>
                    <Spin size="small" />
                  </div>
                ) : images.length === 0 ? (
                  <Empty description="No media available for this variant." />
                ) : (
                  <Row gutter={[12, 12]}>
                    {images.map((image) => (
                      <Col xs={24} sm={12} lg={8} key={image.id}>
                        <div
                          style={{
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#fff',
                          }}
                        >
                          <div style={{ height: 140, background: '#fafafa' }}>
                            {image.mediaType?.startsWith('video/') ? (
                              <video
                                src={toAssetUrl(image.filePath)}
                                controls
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img
                                src={toAssetUrl(image.filePath)}
                                alt={`${selectedColor.colorName} ${image.fileName || 'media'}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </div>
                          <div style={{ padding: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              {image.isPrimary ? (
                                <PlainLabel color="success">Primary</PlainLabel>
                              ) : (
                                <PlainLabel color="default">Secondary</PlainLabel>
                              )}
                              <Button
                                size="small"
                                type="white"
                                outlined
                                danger
                                onClick={() => handleDeleteImage(image)}
                                disabled={deletingImageId === image.id}
                              >
                                {deletingImageId === image.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>

                            <div style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Display Order</div>
                              <Space>
                                <InputNumber
                                  min={0}
                                  value={displayOrderDrafts[image.id]}
                                  onChange={(value) =>
                                    setDisplayOrderDrafts((prev) => ({
                                      ...prev,
                                      [image.id]: value,
                                    }))
                                  }
                                  style={{ width: 96 }}
                                  size="small"
                                />
                                <Button
                                  size="small"
                                  type="white"
                                  outlined
                                  onClick={() => handleSaveDisplayOrder(image.id)}
                                  disabled={updatingOrderId === image.id}
                                >
                                  {updatingOrderId === image.id ? 'Saving...' : 'Save'}
                                </Button>
                              </Space>
                            </div>

                            {!image.isPrimary && (
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => handleSetPrimary(image.id)}
                                disabled={updatingPrimaryId === image.id}
                              >
                                {updatingPrimaryId === image.id ? 'Updating...' : 'Set as Primary'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            ) : (
              <Empty description="Select or add a color to manage varients." />
            )}
          </div>
        </Col>
      </Row>
    </Modal>
  );
}

CatalogueImagesModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  catalogue: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    brand: PropTypes.string,
    model: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    exShowroomPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onCancel: PropTypes.func.isRequired,
};

CatalogueImagesModal.defaultProps = {
  catalogue: null,
};

export default CatalogueImagesModal;
