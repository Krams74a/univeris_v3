import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './api/authApi';
import { ThemeProvider } from './components/ThemeProvider';
import LoginPage from './pages/Auth/LoginPage';
import StudyPlanPage from './pages/Study/StudyPlanPage';
import SubjectPage from './pages/Study/SubjectPage';
import { Spinner } from 'react-bootstrap';
import { loginSuccess } from './store/slices/authSlice';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    const [isChecking, setIsChecking] = useState(true);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const dispatch = useDispatch();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const userData = localStorage.getItem('userData');

                if (token && userData) {
                    const isValid = await authApi.checkAuth();
                    if (isValid) {
                        dispatch(loginSuccess({ token, ...JSON.parse(userData) }));
                    }
                }
            } finally {
                setIsChecking(false);
            }
        };
        checkSession();
    }, [dispatch]);

    if (isChecking) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route 
                        path="/login" 
                        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
                    />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <StudyPlanPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/subject/:subjectId/:termNumber" 
                        element={
                            <ProtectedRoute>
                                <SubjectPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
