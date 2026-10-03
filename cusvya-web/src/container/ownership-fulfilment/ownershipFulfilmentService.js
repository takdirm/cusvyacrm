import { DataService } from '../../config/dataService/dataService';
import { API } from '../../config/api';

const fulfilmentPath = API.ownershipFulfilment.path;
const cataloguePath = API.catalogue.path;

export const getOwnershipFulfilments = async () => {
  const response = await DataService.get(fulfilmentPath);
  return response?.data || [];
};

export const deleteOwnershipFulfilment = async (id) => {
  await DataService.delete(`${fulfilmentPath}/${id}`);
};

export const getOwnershipFulfilmentById = async (id) => {
  const response = await DataService.get(`${fulfilmentPath}/${id}`);
  return response?.data || null;
};

export const createOwnershipFulfilment = async (bookingId) => {
  const response = await DataService.post(`${fulfilmentPath}/${bookingId}/create`, {});
  return response?.data || null;
};

export const getAvailableVendorsForCatalogue = async (catalogueId) => {
  const response = await DataService.get(`${cataloguePath}/${catalogueId}/vendors?activeOnly=true`);
  return response?.data || [];
};

export const submitFulfilmentAction = async (id, actionType, payload) => {
  const endpointMap = {
    assignVendor: 'assign-vendor',
    confirmVendor: 'confirm-vendor',
    notInStock: 'not-in-stock',
    dispatch: 'dispatch',
    deliver: 'deliver',
    receiveVehicle: 'receive-vehicle',
    prepare: 'prepare',
    readyForPickup: 'ready-for-pickup',
    complete: 'complete',
    cancel: 'cancel',
  };

  const endpoint = endpointMap[actionType];
  if (!endpoint) {
    throw new Error('Unsupported fulfilment action');
  }

  const response = await DataService.post(`${fulfilmentPath}/${id}/${endpoint}`, payload || {});
  return response?.data || null;
};
