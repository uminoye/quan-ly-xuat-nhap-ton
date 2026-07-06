import api from './api';

export const getDashboardStats = async (period) => {
  const response = await api.get(`/reports/dashboard${period ? `?period=${period}` : ''}`);
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};

export const getSalesReport = async (period, groupBy = 'date') => {
  const qs = new URLSearchParams({ period, group_by: groupBy }).toString();
  const response = await api.get(`/reports/sales?${qs}`);
  return response.data;
};

export const getLogisticsReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/logistics?${qs}`);
  return response.data;
};

export const getWarehouseReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/warehouse?${qs}`);
  return response.data;
};

export const getFactoryReport = async (period) => {
  const qs = new URLSearchParams({ period }).toString();
  const response = await api.get(`/reports/factory?${qs}`);
  return response.data;
};
