export const OwnershipFulfilmentStatus = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'NotInStock',
  3: 'InTransit',
  4: 'Delivered',
  5: 'VehicleReceived',
  6: 'Preparing',
  7: 'ReadyForPickup',
  8: 'Assigned',
  9: 'Completed',
  10: 'Cancelled',
};

const makeTagStyle = (backgroundColor) => ({
  backgroundColor,
  borderColor: backgroundColor,
  color: '#ffffff',
  fontWeight: 600,
});

export const OwnershipFulfilmentStatusStyles = {
  0: makeTagStyle('#d48806'),
  1: makeTagStyle('#1677ff'),
  2: makeTagStyle('#d4380d'),
  3: makeTagStyle('#0958d9'),
  4: makeTagStyle('#08979c'),
  5: makeTagStyle('#1d39c4'),
  6: makeTagStyle('#722ed1'),
  7: makeTagStyle('#389e0d'),
  8: makeTagStyle('#7cb305'),
  9: makeTagStyle('#237804'),
  10: makeTagStyle('#cf1322'),
  default: {
    backgroundColor: '#595959',
    borderColor: '#595959',
    color: '#ffffff',
    fontWeight: 600,
  },
};

export const FulfilmentSource = {
  0: 'Backroom',
  1: 'Vendor',
};

export const FulfilmentSourceStyles = {
  0: makeTagStyle('#434343'),
  1: makeTagStyle('#531dab'),
  default: {
    backgroundColor: '#595959',
    borderColor: '#595959',
    color: '#ffffff',
    fontWeight: 600,
  },
};
