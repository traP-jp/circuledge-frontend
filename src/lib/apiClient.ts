import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // 必要に応じてタイムアウトなどを設定
  // timeout: 10000,
});

export default apiClient;
