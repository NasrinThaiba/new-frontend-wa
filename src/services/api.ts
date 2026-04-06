import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rough-backend-wa-1.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token to every request
//interceptors - middleware
//config - details about your request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,  //success
  (error) => { //error
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

