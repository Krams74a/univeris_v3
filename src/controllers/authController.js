const authService = require('../services/authService');

class AuthController {
    async login(req, res) {
        try {
            const { login, password } = req.body;
            
            const { data, cookies } = await authService.login(login, password);

            if (cookies) {
                res.setHeader('Set-Cookie', cookies);
            }

            res.json(data);
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                error: error.response?.data?.message || 'Authentication failed'
            });
        }
    }

    async validateToken(req, res) {
        try {
            // Проверяем наличие токена в заголовке
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            // TODO: Добавить проверку валидности токена через SUSU API
            // Пока просто возвращаем успешный ответ
            res.json({ valid: true });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
}

module.exports = new AuthController(); 