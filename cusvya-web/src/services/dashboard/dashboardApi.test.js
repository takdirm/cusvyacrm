import { dashboardApi } from './dashboardApi';
import { DataService } from '../../config/dataService/dataService';

jest.mock('../../config/dataService/dataService', () => ({
  DataService: {
    get: jest.fn(),
  },
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    DataService.get.mockReset();
    DataService.get.mockResolvedValue({ data: { ok: true } });
  });

  it('calls the bookings endpoint with the Swagger query contract', async () => {
    await dashboardApi.getBookings({
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-14T23:59:59.999Z',
      groupBy: 'Month',
      regionId: 'do-not-send',
    });

    expect(DataService.get).toHaveBeenCalledTimes(1);
    expect(DataService.get.mock.calls[0][0]).toBe(
      '/Dashboard/bookings?From=2026-09-01T00%3A00%3A00.000Z&To=2026-09-14T23%3A59%3A59.999Z&GroupBy=Month',
    );
    expect(DataService.get.mock.calls[0][0]).not.toContain('regionId');
  });

  it('calls the payments endpoint with the correct path', async () => {
    await dashboardApi.getPayments({
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-09-14T23:59:59.999Z',
      groupBy: 'Day',
    });

    expect(DataService.get.mock.calls[0][0]).toContain('/Dashboard/payments');
  });
});
