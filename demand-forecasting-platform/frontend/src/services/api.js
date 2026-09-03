import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const getHealth = async () => {
  const res = await apiClient.get('/health');
  return res.data;
};

export const getDashboardMetrics = async () => {
  const res = await apiClient.get('/dashboard');
  return res.data;
};

export const getInventoryItems = async (params = {}) => {
  const res = await apiClient.get('/inventory', { params });
  return res.data;
};

export const getTimeSeriesForecast = async (store = 1, item = 1) => {
  const res = await apiClient.get('/forecast', { params: { store, item } });
  return res.data;
};

export const getModelMetrics = async () => {
  const res = await apiClient.get('/model/metrics');
  return res.data;
};

export const simulateInventory = async (payload) => {
  const res = await apiClient.post('/simulate', payload);
  return res.data;
};

export default apiClient;
