import api from './api';

export const getExports = async () => {
  const response = await api.get('/outbounds');
  return response.data;
};

export const createOutbound = async (payload) => {
  const response = await api.post('/outbounds', payload);
  return response.data;
};

export const respondOutbound = async (orderId, payload) => {
  const response = await api.put(`/outbounds/${orderId}/respond`, payload);
  return response.data;
};
