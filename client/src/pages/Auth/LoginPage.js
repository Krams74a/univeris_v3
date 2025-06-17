import React from 'react';
import { Container } from 'react-bootstrap';
import Login from '../../components/Auth/Login';
import { useTheme } from '../../components/ThemeProvider';

const LoginPage = () => {
    const { isDark } = useTheme();

    return (
        <Container className="mt-5" style={{ maxWidth: '400px' }}>
            <Login />
        </Container>
    );
};

export default LoginPage; 