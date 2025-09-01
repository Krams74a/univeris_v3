const axios = require('axios');

class AuthService {
    async login(login, password) {
        const formData = new URLSearchParams();


        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const length = 32;
        const randomString = Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

        
        formData.append('LoginForm[login]', login);
        formData.append('LoginForm[password]', password);
        formData.append('identity', randomString);

        const response = await axios.post(  
            'https://online.susu.ru/microgateway/api/auth/login',
            formData.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                withCredentials: true
            }
        );

        // Проверяем успешность аутентификации
        const isAuthenticated = response.data && !response.data.error;
        
        return {
            data: {
                ...response.data,
                success: isAuthenticated
            },
            cookies: response.headers['set-cookie']
        };
    }
}

module.exports = new AuthService(); 