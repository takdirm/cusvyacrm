import { FulfilmentSource } from '../ownership-fulfilment/ownershipFulfilmentStatus';

const isOwnershipBooking = (booking) => {
  const type = booking?.bookingType;
  if (type === null || type === undefined) return false;
  if (Number(type) === 1) return true;
  return String(type).toLowerCase() === 'ownership';
};

const sourceValue = (fulfilment) => Number(fulfilment?.fulfilmentSource);
const statusValue = (fulfilment) => Number(fulfilment?.fulfilmentStatus);

const FULFILMENT_ACTION_LABELS = {
  viewFulfilment: 'View Fulfilment',
  createFulfilment: 'Create Fulfilment',
  assignVendor: 'Assign Vendor',
  confirmVendor: 'Confirm Vendor',
  markNotInStock: 'Mark Not In Stock',
  dispatch: 'Dispatch Vendor Order',
  deliver: 'Mark Delivered',
  receiveVehicle: 'Receive Vehicle',
  prepare: 'Prepare Vehicle',
  readyForPickup: 'Ready For Pickup',
  complete: 'Complete Fulfilment',
};

export const getOwnershipActionLabel = (key) => FULFILMENT_ACTION_LABELS[key] || key;

export const getAvailableOwnershipActions = (booking, fulfilment) => {
  if (!isOwnershipBooking(booking)) return [];

  if (!fulfilment) {
    return ['createFulfilment'];
  }

  const source = sourceValue(fulfilment);
  const status = statusValue(fulfilment);
  const actions = ['viewFulfilment'];

  // Vendor and backroom action matrix aligned to backend action endpoints.
  if (status === 0) {
    if (source === 1) actions.push('assignVendor', 'markNotInStock');
    actions.push('cancel');
  } else if (status === 1) {
    if (source === 1) actions.push('dispatch', 'markNotInStock');
    actions.push('cancel');
  } else if (status === 2) {
    if (source === 1) actions.push('assignVendor');
    actions.push('cancel');
  } else if (status === 3) {
    if (source === 1) actions.push('deliver', 'cancel');
  } else if (status === 4) {
    actions.push('receiveVehicle', 'cancel');
  } else if (status === 5) {
    actions.push('prepare', 'cancel');
  } else if (status === 6) {
    actions.push('readyForPickup', 'cancel');
  } else if (status === 7) {
    actions.push('complete', 'cancel');
  } else if (status === 8) {
    if (source === 1) actions.push('confirmVendor', 'markNotInStock');
    actions.push('cancel');
  }

  return Array.from(new Set(actions));
};

export const isBackroomSource = (fulfilment) => sourceValue(fulfilment) === Number(Object.keys(FulfilmentSource)[0]);
