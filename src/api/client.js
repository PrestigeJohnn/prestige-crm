import axios from 'axios';

const api = axios.create({
  baseURL: window.location.origin + '/api',
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response && err.response.status === 401) {
      const rt = localStorage.getItem('refresh_token');
      if (rt) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
          localStorage.setItem('token', data.data.accessToken);
          localStorage.setItem('refresh_token', data.data.refreshToken);
          err.config.headers.Authorization = 'Bearer ' + data.data.accessToken;
          return api(err.config);
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
