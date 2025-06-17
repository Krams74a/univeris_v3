import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Добавляем интерсептор для запросов
api.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Добавляем интерсептор для ответов
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Если токен истек или недействителен
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);

export default api; 