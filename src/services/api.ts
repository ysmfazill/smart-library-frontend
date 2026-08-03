import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register' &&
          window.location.pathname !== '/'
        ) {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Access Denied: You do not have permission.', type: 'error' }}));
      } else if (status === 404) {
        // Suppress 404s globally if they are handled locally, or emit toast
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Resource not found.', type: 'error' }}));
      } else if (status === 409) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: error.response.data?.message || 'Conflict error.', type: 'error' }}));
      } else if (status >= 500) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Internal Server Error. Please try again later.', type: 'error' }}));
      } else if (status === 400 || status === 422) {
        // Typically validation errors, let the component handle it or show generic toast
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: error.response.data?.message || 'Validation failed. Check your input.', type: 'error' }}));
      }
    } else if (error.request) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Network error. Please check your connection.', type: 'error' }}));
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'An unexpected error occurred.', type: 'error' }}));
    }
    
    return Promise.reject(error);
  }
);
