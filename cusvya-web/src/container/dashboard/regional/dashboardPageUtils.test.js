import { buildRangeLabel, createInitialDashboardFilters } from './dashboardPageUtils';

describe('dashboardPageUtils', () => {
  it('creates a current month filter preset', () => {
    const filters = createInitialDashboardFilters();

    expect(filters.preset).toBe('This Month');
    expect(filters.groupBy).toBe('Day');
    expect(filters.from).toBeInstanceOf(Date);
    expect(filters.to).toBeInstanceOf(Date);
  });

  it('formats a human readable range label', () => {
    const label = buildRangeLabel({
      from: new Date('2026-09-01T00:00:00.000Z'),
      to: new Date('2026-09-14T00:00:00.000Z'),
    });

    expect(label).toBe('01 Sep 2026 - 14 Sep 2026');
  });
});
