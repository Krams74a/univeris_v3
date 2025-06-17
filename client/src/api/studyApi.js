import axios from 'axios';

const BASE_URL = 'https://online.susu.ru/microgateway/api/StudyActivity';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
    baseURL: BASE_URL
});

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

const studyApi = {
    getStudyPlan: async () => {
        const response = await api.get('/StudyPlan');
        return response.data;
    },

    getSubjects: async (termNumber) => {
        const response = await api.get(`/Subjects/${termNumber}/ru`);
        return response.data;
    },

    getSubjectJournal: async (subjectId, termNumber, isCourseWork = false) => {
        try {
            const response = await api.get(`/Journal/${subjectId}/${termNumber}/IsCourseWorkOrProject/${isCourseWork}/ru`);
            return response.data;
        } catch (error) {
            console.error('Error fetching subject journal:', error);
            throw error;
        }
    },

    checkAgreementStatus: async (subjectId) => {
        try {
            const response = await api.get(`/IsAllowSetAgreement/${subjectId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking agreement status:', error);
            throw error;
        }
    },

    setAgreement: async (subjectId, isAgreed) => {
        try {
            const response = await api.post(`/SetMarkAgreement/${subjectId}/${isAgreed}`);
            return response.data;
        } catch (error) {
            console.error('Error setting agreement:', error);
            throw error;
        }
    }
};

export { studyApi }; 