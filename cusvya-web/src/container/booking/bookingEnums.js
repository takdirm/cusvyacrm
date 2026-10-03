export const BookingType = {
  0: 'Rental',
  1: 'Ownership',
};

export const BookingControlStatus = {
  0: 'Open',
  1: 'Closed',
};

export const BookingStatus = {
  0: 'Initiated',
  1: 'PaymentFailed',
  2: 'KYCPending',
  3: 'VehicleAssignPending',
  4: 'VehicleAssigned',
  5: 'VehicleReturnedPending',
  6: 'VehicleReturned',
  7: 'Completed',
  8: 'InitiateRefund',
  9: 'Cancelled',
  10: 'PaymentPending',
  11: 'OrderPending',
  12: 'OrderConfirmed',
  13: 'InTransit',
  14: 'TemporaryVehicleAssigned',
  15: 'TemporaryVehicleAvailable',
  16: 'EarlySettlementCompleted',
  17: 'OwnershipTransferPending',
  18: 'ConfirmedOrder',
  19: 'AwaitingVehicle',
  20: 'VehicleReadyForPickup',
};

export const BookingStatusColors = {
  0: 'gold',
  1: 'red',
  2: 'orange',
  3: 'blue',
  4: 'cyan',
  5: 'purple',
  6: 'geekblue',
  7: 'green',
  8: 'volcano',
  9: 'red',
  10: 'orange',
  11: 'gold',
  12: 'green',
  13: 'processing',
  14: 'magenta',
  15: 'lime',
  16: 'green',
  17: 'purple',
  18: 'cyan',
  19: 'gold',
  20: 'blue',
};

export const PaymentType = {
  0: 'InitialPayment',
  1: 'PlanChangePayment',
  2: 'ExtraKMCharge',
  3: 'RecurringPayment',
  4: 'WalletRecharge',
  5: 'RefundCredit',
  6: 'ArrearsPayment',
  7: 'Renewal',
};

export const PaymentStatus = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Cancelled',
  3: 'InitiateRefund',
  4: 'Refunded',
  5: 'Failed',
  6: 'OnHold',
};

export const PaymentStatusColors = {
  0: 'gold',
  1: 'green',
  2: 'volcano',
  3: 'blue',
  4: 'cyan',
  5: 'volcano',
  6: 'orange',
};
