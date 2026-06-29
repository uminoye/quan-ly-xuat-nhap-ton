import api from './api';

export const getWarehouses = async () => {
  const response = await api.get('/warehouses');
  return response.data;
};

export const createWarehouse = async (payload) => {
  const response = await api.post('/warehouses', payload);
  return response.data;
};

export const deleteWarehouse = async (warehouseId) => {
  const response = await api.delete(`/warehouses/${warehouseId}`);
  return response.data;
};
