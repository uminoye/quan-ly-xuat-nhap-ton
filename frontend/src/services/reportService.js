import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data;
};

export const getInventoryReport = async () => {
  const response = await api.get('/reports/inventory');
  return response.data;
};
