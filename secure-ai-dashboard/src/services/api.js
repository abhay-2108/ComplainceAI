import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response Interceptor for Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const getDashboardMetrics = async () => {
    const response = await api.get('/api/dashboard/metrics');
    return response.data;
};

export const getViolations = async () => {
    const response = await api.get('/api/violations');
    return response.data;
};

export const getPolicies = async () => {
    const response = await api.get('/api/policies/');
    return response.data;
};

export const uploadPolicy = async (formData) => {
    const response = await api.post('/api/policies/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getAgentsStatus = async () => {
    // Note: This endpoint should return the status of the crew
    const response = await api.get('/api/agents/status');
    return response.data;
};

// Trigger manual processing
export const runAgents = async () => {
    const response = await api.post('/api/agents/run-agents');
    return response.data;
};

export default api;
