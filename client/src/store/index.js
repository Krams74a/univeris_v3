import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gradesReducer from './slices/gradesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    grades: gradesReducer,
  },
});

window.store = store;

export default store; 