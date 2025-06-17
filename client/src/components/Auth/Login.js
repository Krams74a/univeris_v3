import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure, logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';
import { useTheme } from '../ThemeProvider';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login || !password) {
      dispatch(loginFailure('Заполните все поля'));
      return;
    }

    dispatch(loginStart());
    
    try {
      const result = await authApi.login({ login, password });
      
      if (result.success) {
        dispatch(loginSuccess(result));
        navigate('/');
      } else {
        dispatch(loginFailure(result.message || 'Ошибка аутентификации'));
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch(loginFailure(
        error.response?.data?.message || 
        error.message || 
        'Ошибка при входе в систему'
      ));
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };
  const UserInfo = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        dispatch(logout());
        navigate('/login');
      }
    };

    return (
      <Card bg={isDark ? 'dark' : 'light'} text={isDark ? 'light' : 'dark'} border={isDark ? 'light' : 'dark'} className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Добро пожаловать!</h3>
          <div>
            <Button 
              variant={isDark ? 'outline-light' : 'outline-dark'} 
              className="me-2"
              onClick={toggleTheme}
            >
              {isDark ? '☀️' : '🌙'}
            </Button>
            <Button variant="outline-danger" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Card.Title>{user.firstName} {user.middleName} {user.lastName}</Card.Title>
          {user.student && (
            <div className="mt-3">
              <p><strong>Группа:</strong> {user.student.groupName}</p>
              <p><strong>Специальность:</strong> {user.student.specialityName}</p>
              <p><strong>Форма обучения:</strong> {user.student.educationForm}</p>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Card bg={isDark ? 'dark' : 'light'} text={isDark ? 'light' : 'dark'} border={isDark ? 'light' : 'dark'}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h2 className="mb-0">Вход в систему</h2>
        <Button 
          variant={isDark ? 'outline-light' : 'outline-dark'} 
          onClick={toggleTheme}
        >
          {isDark ? '☀️' : '🌙'}
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Логин</Form.Label>
            <Form.Control
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              bg={isDark ? 'dark' : 'light'}
              text={isDark ? 'light' : 'dark'}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Пароль</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg={isDark ? 'dark' : 'light'}
              text={isDark ? 'light' : 'dark'}
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default Login; 