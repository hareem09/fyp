// frontend/src/api/axios.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true // important if using cookies for refresh token
});

// 🔐 Attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// 🔁 Refresh logic variables
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};


// 🔄 Response interceptor
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // 👉 If token expired (401)
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If already refreshing → queue requests
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🔁 CALL REFRESH TOKEN API
        const res = await axios.post(
          'http://localhost:3000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        // ✅ Save new token
        localStorage.setItem('token', newToken);

        // ✅ Update header
        API.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;

        processQueue(null, newToken);

        // 🔁 Retry original request
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return API(originalRequest);

      } catch (err) {
        processQueue(err, null);

        // ❌ If refresh fails → logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';

        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;