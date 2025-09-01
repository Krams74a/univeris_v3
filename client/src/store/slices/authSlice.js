import { createSlice } from '@reduxjs/toolkit';

// Функция для проверки срока действия токена
const isTokenExpired = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const { exp } = JSON.parse(jsonPayload);
        const currentTime = Math.floor(Date.now() / 1000);

        // Проверяем только, что токен не истек
        return exp < currentTime;
    } catch (err) {
        console.error('Error checking token expiration:', err);
        return true;
    }
};

// Функция для загрузки начального состояния из localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('authState');
        if (serializedState === null) {
            return {
                isAuthenticated: false,
                user: null,
                token: null,
                loading: false,
                error: null,
            };
        }
        const state = JSON.parse(serializedState);
        
        // Проверяем срок действия токена при загрузке
        if (state.token && isTokenExpired(state.token)) {
            localStorage.removeItem('authState');
            return {
                isAuthenticated: false,
                user: null,
                token: null,
                loading: false,
                error: null,
            };
        }
        
        return state;
    } catch (err) {
        console.error('Error loading auth state:', err);
        return {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
        };
    }
};

// Функция для сохранения состояния в localStorage
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('authState', serializedState);
    } catch (err) {
        console.error('Error saving auth state:', err);
    }
};

const initialState = loadState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            const { accessToken, id, userName, email, firstName, middleName, lastName, student, ...rest } = action.payload;
            
            // Проверяем срок действия токена перед сохранением
            if (isTokenExpired(accessToken)) {
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
                state.loading = false;
                state.error = 'Токен истек';
                return;
            }

            state.isAuthenticated = true;
            state.token = accessToken;
            state.user = {
                id,
                userName,
                email,
                firstName,
                middleName,
                lastName,
                student: student?.[0] || null,
                ...rest
            };
            state.loading = false;
            state.error = null;
            saveState(state);
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.accessToken = null;
            state.loading = false;
            state.error = null;
            localStorage.removeItem('authState');
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer; 