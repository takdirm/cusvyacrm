import { DataService } from '../../../../config/dataService/dataService';
import { API } from '../../../../config/api';

const cataloguePath = API.catalogue.path;

export const getCatalogueVendors = async (catalogueId, activeOnly = false) => {
  const response = await DataService.get(`${cataloguePath}/${catalogueId}/vendors?activeOnly=${activeOnly}`);
  return response?.data || [];
};

export const getCatalogueVendor = async (catalogueId, mappingId) => {
  const response = await DataService.get(`${cataloguePath}/${catalogueId}/vendors/${mappingId}`);
  return response?.data || null;
};

export const createCatalogueVendor = async (catalogueId, payload) => {
  const response = await DataService.post(`${cataloguePath}/${catalogueId}/vendors`, payload);
  return response?.data || null;
};

export const updateCatalogueVendor = async (catalogueId, mappingId, payload) => {
  const response = await DataService.put(`${cataloguePath}/${catalogueId}/vendors/${mappingId}`, payload);
  return response?.data || null;
};

export const activateCatalogueVendor = async (catalogueId, mappingId) => {
  const response = await DataService.post(`${cataloguePath}/${catalogueId}/vendors/${mappingId}/activate`, {});
  return response?.data || null;
};

export const deactivateCatalogueVendor = async (catalogueId, mappingId) => {
  const response = await DataService.post(`${cataloguePath}/${catalogueId}/vendors/${mappingId}/deactivate`, {});
  return response?.data || null;
};

export const deleteCatalogueVendor = async (catalogueId, vendorId) => {
  await DataService.delete(`${cataloguePath}/${catalogueId}/vendors/${vendorId}`);
};
