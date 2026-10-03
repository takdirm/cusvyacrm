import { DataService } from '../../../../config/dataService/dataService';
import { API } from '../../../../config/api';

const cataloguePath = API.catalogue.path;

const extractMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) return responseData;
  if (responseData?.message) return responseData.message;
  return fallbackMessage;
};

export const getCatalogueColors = async (catalogueId) => {
  const response = await DataService.get(`${cataloguePath}/${catalogueId}/colors`);
  return response?.data || [];
};

export const createCatalogueColor = async (catalogueId, payload) => {
  const response = await DataService.post(`${cataloguePath}/${catalogueId}/colors`, payload);
  return response?.data;
};

export const updateCatalogueColor = async (catalogueId, colorId, payload) => {
  const response = await DataService.put(`${cataloguePath}/${catalogueId}/colors/${colorId}`, payload);
  return response?.data;
};

export const deleteCatalogueColor = async (catalogueId, colorId) => {
  await DataService.delete(`${cataloguePath}/${catalogueId}/colors/${colorId}`);
};

export const getCatalogueColorImages = async (catalogueId, colorId) => {
  const response = await DataService.get(`${cataloguePath}/${catalogueId}/colors/${colorId}/images`);
  return response?.data || [];
};

export const uploadCatalogueColorImages = async (catalogueId, colorId, files, options = {}) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  if (options.displayOrderStart !== undefined && options.displayOrderStart !== null) {
    formData.append('displayOrderStart', String(options.displayOrderStart));
  }

  if (options.isPrimary !== undefined && options.isPrimary !== null) {
    formData.append('isPrimary', String(Boolean(options.isPrimary)));
  }

  const response = await DataService.post(`${cataloguePath}/${catalogueId}/colors/${colorId}/images`, formData, {
    headers: {
      Accept: 'application/json',
    },
  });

  return response?.data;
};

export const updateCatalogueColorImage = async (catalogueId, colorId, imageId, payload) => {
  const response = await DataService.put(
    `${cataloguePath}/${catalogueId}/colors/${colorId}/images/${imageId}`,
    payload,
  );
  return response?.data;
};

export const deleteCatalogueColorImage = async (catalogueId, colorId, imageId) => {
  await DataService.delete(`${cataloguePath}/${catalogueId}/colors/${colorId}/images/${imageId}`);
};

export { extractMessage };
