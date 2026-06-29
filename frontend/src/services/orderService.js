import api from './api';

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderItems = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/items`);
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return response.data;
};

export const updateOrder = async (orderId, payload) => {
  const response = await api.put(`/orders/${orderId}`, payload);
  return response.data;
};
