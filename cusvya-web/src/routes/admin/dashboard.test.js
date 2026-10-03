import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardRoutes from './dashboard';

jest.mock('feather-icons-react', () => () => null);

describe('DashboardRoutes', () => {
  it('renders a suspense fallback while the dashboard module is loading', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard/overview']}>
        <DashboardRoutes />
      </MemoryRouter>,
    );

    expect(container.querySelector('.spin')).not.toBeNull();
  });
});
