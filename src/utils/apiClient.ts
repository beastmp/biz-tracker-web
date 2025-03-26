import axios, { AxiosRequestConfig } from 'axios';
import { config } from '@config/env';

// Create a normalized base URL without duplicate /api segments
const normalizeBaseUrl = (url: string) => {
  // Remove trailing slashes
  let baseUrl = url.replace(/\/+$/, '');

  // Check if baseUrl already ends with /api
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }
  return baseUrl;
};

// Create an API client with baseURL
const apiClient = axios.create({
  baseURL: normalizeBaseUrl(config.API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Special handling for FormData
    if (config.data instanceof FormData) {
      // Let the browser set the correct Content-Type with boundary
      delete config.headers['Content-Type'];
    }

    // Debug logging
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// HTTP methods
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

export const post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

export const put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

export const patch = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

// Special case for form data (file uploads)
export const postFormData = async <T>(url: string, formData: FormData): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: false
  });
  return response.data;
};

export default apiClient;
