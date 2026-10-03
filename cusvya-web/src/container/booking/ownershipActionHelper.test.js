import { getAvailableOwnershipActions } from './ownershipActionHelper';

describe('getAvailableOwnershipActions', () => {
  it('returns createFulfilment for ownership booking without fulfilment', () => {
    const actions = getAvailableOwnershipActions({ bookingType: 1 }, null);
    expect(actions).toContain('createFulfilment');
  });

  it('does not return vendor actions for backroom source', () => {
    const actions = getAvailableOwnershipActions({ bookingType: 1 }, { fulfilmentSource: 0, fulfilmentStatus: 1 });
    expect(actions).not.toContain('prepare');
    expect(actions).not.toContain('assignVendor');
    expect(actions).not.toContain('confirmVendor');
  });

  it('returns vendor actions for vendor source', () => {
    const actions = getAvailableOwnershipActions({ bookingType: 1 }, { fulfilmentSource: 1, fulfilmentStatus: 1 });
    expect(actions).toContain('confirmVendor');
    expect(actions).toContain('dispatch');
  });

  it('does not expose prepare before vehicle received for backroom source', () => {
    expect(
      getAvailableOwnershipActions({ bookingType: 1 }, { fulfilmentSource: 0, fulfilmentStatus: 0 }),
    ).not.toContain('prepare');
    expect(
      getAvailableOwnershipActions({ bookingType: 1 }, { fulfilmentSource: 0, fulfilmentStatus: 1 }),
    ).not.toContain('prepare');
  });

  it('exposes prepare only after vehicle is received for backroom source', () => {
    const actions = getAvailableOwnershipActions({ bookingType: 1 }, { fulfilmentSource: 0, fulfilmentStatus: 5 });
    expect(actions).toContain('prepare');
  });

  it('returns empty for rental booking', () => {
    const actions = getAvailableOwnershipActions({ bookingType: 0 }, { fulfilmentSource: 1, fulfilmentStatus: 1 });
    expect(actions).toEqual([]);
  });
});
