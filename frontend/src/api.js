import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const fetchSummary = () => api.get('/analytics/summary').then(r => r.data);

export const fetchSessions = (params = {}) =>
  api.get('/sessions', { params }).then(r => r.data);

export const fetchSessionEvents = (sessionId) =>
  api.get(`/sessions/${sessionId}/events`).then(r => r.data);

export const fetchHeatmapData = (pageUrl) =>
  api.get('/heatmap', { params: { page_url: pageUrl } }).then(r => r.data);

export const fetchPages = () => api.get('/heatmap').then(r => r.data);

export const deleteSession = (sessionId) =>
  api.delete(`/sessions/${sessionId}`).then(r => r.data);

export const checkHealth = () => api.get('/health').then(r => r.data);

export default api;
