import { API } from '../../config/api';
import { DataService } from '../../config/dataService/dataService';

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  if (params.from) query.append('From', params.from);
  if (params.to) query.append('To', params.to);
  if (params.groupBy) query.append('GroupBy', params.groupBy);

  return query.toString();
};

const requestDashboard = async (path, params) => {
  const query = buildQuery(params);
  const url = query ? `${path}?${query}` : path;
  const response = await DataService.get(url);
  return response?.data ?? null;
};

export const dashboardApi = {
  getBookings: (params) => requestDashboard(API.dashboard.bookings, params),
  getPayments: (params) => requestDashboard(API.dashboard.payments, params),
  getWallet: (params) => requestDashboard(API.dashboard.wallet, params),
  getCustomers: (params) => requestDashboard(API.dashboard.customers, params),
  getFleet: (params) => requestDashboard(API.dashboard.fleet, params),
  getPlans: (params) => requestDashboard(API.dashboard.plans, params),
  getArrears: (params) => requestDashboard(API.dashboard.arrears, params),
};
