import axios from 'axios';

// Su dung relative URL - Vercel se proxy /api/* den backend Render qua vercel.json rewrites
const api = axios.create({
  baseURL: '/api',
});

// Tu dong gan Token vao moi lan goi API
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tu dong vet ra trang Login neu Token het han (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
