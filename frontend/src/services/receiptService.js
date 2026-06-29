import api from './api';

export const getImports = async () => {
  const response = await api.get('/receipts');
  return response.data;
};

export const createImportRequest = async (payload) => {
  const response = await api.post('/receipts', payload);
  return response.data;
};

export const respondReceipt = async (receiptId, payload) => {
  const response = await api.put(`/receipts/${receiptId}/respond`, payload);
  return response.data;
};
