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
    const response = await api.get('/api/violations/');
    return response.data;
};

export const getViolationById = async (id) => {
    const response = await api.get(`/api/violations/${id}`);
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

// Monitoring Controls
export const getMonitoringStatus = async () => {
    const response = await api.get('/api/agents/monitoring-status');
    return response.data;
};

export const startMonitoring = async () => {
    const response = await api.post('/api/agents/start-monitoring');
    return response.data;
};

export const stopMonitoring = async () => {
    const response = await api.post('/api/agents/stop-monitoring');
    return response.data;
};

// Reports
export const getReports = async () => {
    const response = await api.get('/api/reports/');
    return response.data;
};

// Audit Logs
export const getAuditLogs = async (limit = 100) => {
    const response = await api.get(`/api/audit/?limit=${limit}`);
    return response.data;
};

// Predictions Analytics
export const getPredictionsAnalytics = async () => {
    const response = await api.get('/api/predictions/analytics');
    return response.data;
};

// Agent live activity log
export const getAgentActivity = async (limit = 12) => {
    const response = await api.get(`/api/agents/activity?limit=${limit}`);
    return response.data;
};

// RF Model — live risk prediction

// Sends all fields the RandomForest model was trained on
export const predictRisk = async ({
    amount_paid, amount_received,
    from_bank, to_bank,
    hour, day_of_week,
    payment_format, payment_currency, receiving_currency,
    transaction_type = 'UNKNOWN', amount = 0
}) => {
    const response = await api.post('/api/risk/predict-risk', {
        amount_paid, amount_received,
        from_bank, to_bank,
        hour, day_of_week,
        payment_format, payment_currency, receiving_currency,
        transaction_type, amount
    });
    return response.data;
};

export default api;
