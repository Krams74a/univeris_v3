import api from './axiosConfig';

export const gradesApi = {
    getGrades: async () => {
        const response = await api.get('/grades');
        return response.data;
    }
}; 