import axios from 'axios';

// Enable dynamic API URL loading from the current hostname if using ngrok
const determineApiUrl = () => {
  const hostname = window.location.hostname;
  
  // Check if we're on a ngrok domain
  if (hostname.includes('ngrok')) {
    return `https://${hostname}/api/v1`;
  }
  
  // Default to localhost:8000 for the backend
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
};

const API_URL = determineApiUrl();

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;