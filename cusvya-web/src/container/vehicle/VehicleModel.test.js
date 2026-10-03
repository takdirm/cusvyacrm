import { buildVehicleModelQueryString } from './VehicleModel';

describe('buildVehicleModelQueryString', () => {
  it('includes vehicleCategory when provided', () => {
    const params = buildVehicleModelQueryString({ searchTerm: 'test', vehicleCategory: '2' }, 1, 10);

    expect(params).toContain('page=1');
    expect(params).toContain('pageSize=10');
    expect(params).toContain('searchTerm=test');
    expect(params).toContain('vehicleCategory=2');
  });

  it('omits vehicleCategory when blank', () => {
    const params = buildVehicleModelQueryString({ searchTerm: '', vehicleCategory: '' }, 1, 10);

    expect(params).toContain('page=1');
    expect(params).not.toContain('vehicleCategory=');
  });
});
