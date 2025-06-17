import axios from 'axios';
import store from '../store';
import { loginSuccess, logout } from '../store/slices/authSlice';

const API_URL = 'https://online.susu.ru/microgateway/api';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
    baseURL: API_URL
});

// Функция для проверки валидности токена
const validateToken = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/StudyActivity/StudyPlan`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.status === 200;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

// Добавляем перехватчик для добавления токена к каждому запросу
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Добавляем перехватчик для обработки ответов
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);

// Функция для проверки и восстановления сессии
const checkAndRestoreSession = async () => {
    const savedToken = localStorage.getItem('authToken');
    const savedUserData = localStorage.getItem('userData');

    if (savedToken && savedUserData) {
        try {
            // Проверяем валидность токена
            const isValid = await validateToken(savedToken);
            
            if (isValid) {
                const userData = JSON.parse(savedUserData);
                store.dispatch(loginSuccess({ token: savedToken, ...userData }));
            } else {
                // Если токен невалиден, очищаем данные
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                store.dispatch(logout());
            }
        } catch (error) {
            console.error('Error restoring session:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            store.dispatch(logout());
        }
    }
};

// Запускаем проверку сессии при загрузке
checkAndRestoreSession();

const authApi = {
    login: async (credentials) => {
        try {
            const formData = new FormData();
            formData.append('login', credentials.login);
            formData.append('password', credentials.password);

            const response = await axios.post(`${API_URL}/Auth/Login`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Проверяем наличие токена в ответе
            if (response.data && response.data.token) {
                const { token, ...userData } = response.data;
                
                // Сохраняем токен и данные пользователя
                localStorage.setItem('authToken', token);
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Обновляем состояние Redux
                store.dispatch(loginSuccess({ token, ...userData }));
                
                return { success: true, token, ...userData };
            } else {
                console.error('Login response missing token:', response.data);
                return { 
                    success: false, 
                    message: 'Неверный формат ответа от сервера' 
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Ошибка при входе в систему'
            };
        }
    },

    logout: async () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        store.dispatch(logout());
    },

    validateToken,

    checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (!token || !userData) {
            return false;
        }

        try {
            const isValid = await validateToken(token);
            if (!isValid) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                store.dispatch(logout());
                return false;
            }
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            store.dispatch(logout());
            return false;
        }
    }
};

export { authApi }; 