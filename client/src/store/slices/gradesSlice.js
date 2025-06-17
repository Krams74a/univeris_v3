import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  grades: [],
  loading: false,
  error: null,
};

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    fetchGradesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGradesSuccess: (state, action) => {
      state.grades = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchGradesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchGradesStart, fetchGradesSuccess, fetchGradesFailure } = gradesSlice.actions;
export default gradesSlice.reducer; 