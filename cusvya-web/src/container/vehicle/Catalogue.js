import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Spin, Select, Input, Button as AntButton, Space } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';
import { Button } from '../../components/buttons/buttons';
import { axiosDataRead, axiosDataDelete } from '../../redux/axiomservice/actionCreator';
import { API } from '../../config/api/index';
import { ChargingTypeOptions, FuelTypeOptions, VehicleCategoryOptions } from '../../config/enum/enum';

const CatalogueList = lazy(() => import('./overview/CatalogueList'));
const CatalogueModal = lazy(() => import('./overview/CatalogueModal'));
const CatalogueImagesModal = lazy(() => import('./overview/CatalogueImagesModal'));

const { Option } = Select;

const defaultFilters = {
  fuelType: '',
  chargingType: '',
  vehicleCategory: '1',
  isLicenseRequired: '',
  searchTerm: '',
};

function Catalogue() {
  const dispatch = useDispatch();

  const { catalogues, isLoading, totalCount } = useSelector((state) => ({
    catalogues: state.Service?.data?.items ? state.Service.data.items : [],
    isLoading: state.Service?.loading || false,
    totalCount: state.Service?.data?.totalCount || 0,
  }));

  const [state, setState] = useState({
    current: 1,
    pageSize: 10,
    modalVisible: false,
    imagesModalVisible: false,
    selectedCatalogue: null,
    imagesCatalogue: null,
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);

  const { current, pageSize, modalVisible, imagesModalVisible, selectedCatalogue, imagesCatalogue } = state;

  const buildQueryString = (f, page, size) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('pageSize', size);
    if (f.fuelType !== '' && f.fuelType !== null && f.fuelType !== undefined) params.append('fuelType', f.fuelType);
    if (f.chargingType !== '' && f.chargingType !== null && f.chargingType !== undefined)
      params.append('chargingType', f.chargingType);
    if (f.vehicleCategory !== '' && f.vehicleCategory !== null && f.vehicleCategory !== undefined)
      params.append('vehicleCategory', String(f.vehicleCategory));
    if (f.isLicenseRequired !== '' && f.isLicenseRequired !== null && f.isLicenseRequired !== undefined)
      params.append('isLicenseRequired', String(f.isLicenseRequired));
    if (f.searchTerm && f.searchTerm.trim() !== '') params.append('searchTerm', f.searchTerm.trim());
    return params.toString();
  };

  const getData = async (page = 1, size = 10, f = filters) => {
    const endpoint = `${API.catalogue.path}/paged?${buildQueryString(f, page, size)}`;
    await dispatch(axiosDataRead(endpoint));
  };

  useEffect(() => {
    getData(1, 10, defaultFilters);
  }, [dispatch]);

  useEffect(() => {
    if (current !== 1 || pageSize !== 10) {
      getData(current, pageSize);
    }
  }, [current, pageSize]);

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    setState((prev) => ({ ...prev, current: 1 }));
    getData(1, pageSize, pendingFilters);
  };

  const handleResetFilters = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
    setState((prev) => ({ ...prev, current: 1 }));
    getData(1, pageSize, defaultFilters);
  };

  const handlePageChange = (page, size) => setState((prev) => ({ ...prev, current: page, pageSize: size }));

  const handleCreate = () => {
    setState((prev) => ({ ...prev, modalVisible: true, selectedCatalogue: null }));
  };

  const handleEdit = (record) => {
    setState((prev) => ({ ...prev, modalVisible: true, selectedCatalogue: record }));
  };

  const closeModal = () => {
    setState((prev) => ({ ...prev, modalVisible: false, selectedCatalogue: null }));
  };

  const handleManageImages = (record) => {
    setState((prev) => ({ ...prev, imagesModalVisible: true, imagesCatalogue: record }));
  };

  const closeImagesModal = () => {
    setState((prev) => ({ ...prev, imagesModalVisible: false, imagesCatalogue: null }));
  };

  const handleDelete = (record) => {
    dispatch(
      axiosDataDelete({
        path: API.catalogue.path,
        id: record.id,
        getData: () => getData(current, pageSize),
      }),
    );
  };

  const filterSelect = (label, field, options) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{label}</span>
      <Select
        value={pendingFilters[field]}
        onChange={(val) => setPendingFilters((prev) => ({ ...prev, [field]: val }))}
        style={{ width: 170 }}
        size="small"
        allowClear
        placeholder="All"
      >
        <Option value="">All</Option>
        {options.map((o) => (
          <Option key={o.value} value={o.value}>
            {o.label}
          </Option>
        ))}
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader
        ghost
        title="Vehicle Catalogues"
        buttons={[
          <div key="1" className="page-header-actions">
            <Button size="small" type="primary" onClick={handleCreate}>
              + Add Catalogue
            </Button>
          </div>,
        ]}
      />
      <Main>
        <Cards headless style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600, marginBottom: 2 }}>
              <FeatherIcon icon="filter" size={14} style={{ marginRight: 4 }} /> Filters:
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Search</span>
              <Input
                value={pendingFilters.searchTerm}
                onChange={(e) => setPendingFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
                onPressEnter={handleApplyFilters}
                placeholder="Brand, model, summary..."
                size="small"
                style={{ width: 220 }}
                allowClear
                suffix={<FeatherIcon icon="search" size={12} color="#bbb" />}
              />
            </div>

            {filterSelect(
              'Vehicle Category',
              'vehicleCategory',
              VehicleCategoryOptions.map((option) => ({ ...option, value: String(option.value) })),
            )}
            {filterSelect('Licence Required', 'isLicenseRequired', [
              { label: 'Required', value: 'true' },
              { label: 'Not Required', value: 'false' },
            ])}
            {filterSelect('Fuel Type', 'fuelType', FuelTypeOptions)}
            {filterSelect('Charging Type', 'chargingType', ChargingTypeOptions)}

            <Space>
              <AntButton
                type="primary"
                size="small"
                onClick={handleApplyFilters}
                icon={<FeatherIcon icon="search" size={14} />}
              >
                Apply
              </AntButton>
              <AntButton size="small" onClick={handleResetFilters} icon={<FeatherIcon icon="rotate-ccw" size={14} />}>
                Reset
              </AntButton>
            </Space>
          </div>
        </Cards>

        <Row gutter={25}>
          <Col xs={24}>
            <Cards headless>
              <Suspense
                fallback={
                  <div className="spin">
                    <Spin size="large" />
                  </div>
                }
              >
                <CatalogueList
                  catalogues={catalogues}
                  loading={isLoading}
                  currentPage={current}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  onEdit={handleEdit}
                  onManageImages={handleManageImages}
                  onDelete={handleDelete}
                />
              </Suspense>
            </Cards>
          </Col>
        </Row>

        <Suspense fallback={<div>Loading...</div>}>
          {modalVisible && (
            <CatalogueModal
              visible={modalVisible}
              onCancel={closeModal}
              onSuccess={() => getData(current, pageSize)}
              catalogueData={selectedCatalogue}
            />
          )}
        </Suspense>

        <Suspense fallback={<div>Loading...</div>}>
          {imagesModalVisible && (
            <CatalogueImagesModal
              visible={imagesModalVisible}
              catalogue={imagesCatalogue}
              onCancel={closeImagesModal}
            />
          )}
        </Suspense>
      </Main>
    </>
  );
}

export default Catalogue;
