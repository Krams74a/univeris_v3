import React from 'react';
import { Container, Button } from 'react-bootstrap';
import StudyPlan from '../../components/Study/StudyPlan';
import { useTheme } from '../../components/ThemeProvider';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { authApi } from '../../api/authApi';

const StudyPlanPage = () => {
    const { isDark, toggleTheme } = useTheme();
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
        <Container className="mt-5">
            <div className="d-flex justify-content-end mb-3">
                <Button 
                    variant={isDark ? 'outline-light' : 'outline-dark'} 
                    className="me-2"
                    onClick={toggleTheme}
                >
                    {isDark ? '☀️' : '🌙'}
                </Button>
                <Button 
                    variant="outline-danger"
                    onClick={handleLogout}
                >
                    Выйти
                </Button>
            </div>
            <StudyPlan />
        </Container>
    );
};

export default StudyPlanPage; 