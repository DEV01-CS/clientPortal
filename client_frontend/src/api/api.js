import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

// Log API URL in development to help debug
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

// Warn if using localhost in production
if (process.env.NODE_ENV === 'production' && (API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('localhost'))) {
  console.error(' WARNING: Using localhost API URL in production! Set REACT_APP_API_BASE_URL in Vercel environment variables.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // important if using sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Content-Type is set for all requests
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - token refresh or logout
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and haven't tried to refresh yet
    // BUT: Don't try to refresh if it's an admin OAuth error (let it pass through)
    const isAdminOAuthError = error.response?.data?.error === "Admin Google account not connected" ||
                              error.response?.data?.message?.includes("Admin Google account");
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAdminOAuthError) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      
      if (!refreshToken) {
        // No refresh token, logout user
        processQueue(error, null);
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token - use axios directly to avoid interceptor loop
        // Create a new axios instance without interceptors for token refresh
        const refreshAxios = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const response = await refreshAxios.post('/api/accounts/token/refresh/', {
          refresh: refreshToken
        });

        // Handle different response formats
        const access = response.data?.access || response.data?.access_token;
        if (!access) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Token refresh response:', response.data);
          }
          throw new Error('No access token in refresh response');
        }
        
        localStorage.setItem("token", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        processQueue(null, access);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        if (process.env.NODE_ENV === 'development') {
          console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        }
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Log 400 errors in development for debugging
    if (error.response?.status === 400 && process.env.NODE_ENV === 'development') {
      console.error('400 Bad Request:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        requestData: error.config?.data
      });
    }

    return Promise.reject(error);
  }
);

export default api;
