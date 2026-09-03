import axios from 'axios';

// Production API Base URL pointing to live Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://customer-intelligence-api-b5dq.onrender.com/api' : 'http://localhost:8000/api');

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

export const getCustomers = async (params = {}) => {
  const res = await apiClient.get('/customers', { params });
  return res.data;
};

export const getCustomerDetails = async (customerId) => {
  const res = await apiClient.get(`/customers/${customerId}`);
  return res.data;
};

export const getCustomerExplanation = async (customerId) => {
  const res = await apiClient.get(`/customers/${customerId}/explanation`);
  return res.data;
};

export const getCustomerRecommendation = async (customerId) => {
  const res = await apiClient.get(`/customers/${customerId}/recommendation`);
  return res.data;
};

export const getModelMetrics = async () => {
  const res = await apiClient.get('/model/metrics');
  return res.data;
};

export const predictCustomer = async (customerData) => {
  const res = await apiClient.post('/predict', customerData);
  return res.data;
};

export default apiClient;
