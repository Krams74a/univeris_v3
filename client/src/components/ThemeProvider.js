import React, { createContext, useContext, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true; // По умолчанию тёмная тема
    });

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        document.body.className = isDark ? 'bg-dark text-light' : 'bg-light text-dark';
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            <Container fluid className={`min-vh-100 ${isDark ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
                {children}
            </Container>
        </ThemeContext.Provider>
    );
}; 