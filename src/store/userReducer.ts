import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Habit } from '@t/habits';
import type { Measurement, MeasurementUnit } from '@t/measurements';
import type { Recording, RecordingData } from '@t/recording';
import type { User } from '@t/users';
import { createUserState, type UserState } from '@type/redux';

const initialState: UserState = createUserState();

const userStateSlice = createSlice({
  name: 'userState',
  initialState,
  reducers: {
    editName: (state: UserState, action: PayloadAction<string>) => {
      state.name = action.payload;
    },

    editEmail: (state: UserState, action: PayloadAction<string>) => {
      state.email = action.payload;
    },

    addMeasurement: (state: UserState, action: PayloadAction<Measurement>) => {
      state.measurements.push(action.payload);
    },

    removeMeasurement: (state: UserState, action: PayloadAction<string>) => {
      state.measurements = state.measurements.filter(
        (m): boolean => m.id !== action.payload
      );
    },

    editMeasurement: (state: UserState, action: PayloadAction<{
        id: string;
        updates: Partial<Measurement>;
      }>) => {
      const index = state.measurements.findIndex(
        (m): boolean => m.id === action.payload.id
      );
      if (index !== -1) {
        state.measurements[index] = { ...state.measurements[index], ...action.payload.updates };
      }
    },

    addMeasurementUnit: (state: UserState, action: PayloadAction<MeasurementUnit>) => {
      state.measurementUnits.push(action.payload);
    },

    removeMeasurementUnit: (state: UserState, action: PayloadAction<string>) => {
      state.measurementUnits = state.measurementUnits.filter(
        (m): boolean => m.id !== action.payload
      );
    },

    editMeasurementUnit: (state: UserState, action: PayloadAction<{
        id: string;
        updates: Partial<MeasurementUnit>;
      }>) => {
      const index = state.measurementUnits.findIndex(
        (m): boolean => m.id === action.payload.id
      );
      if (index !== -1) {
        state.measurementUnits[index] = { ...state.measurementUnits[index], ...action.payload.updates };
      }
    },

    addRecording: (state: UserState, action: PayloadAction<Recording>) => {
      state.recordings.unshift(action.payload);
    },

    addRecordings: (state: UserState, action: PayloadAction<Recording[]>) => {
      state.recordings.unshift(...action.payload);
    },

    editRecording: (state: UserState, action: PayloadAction<{
      id: string;
      updates: Partial<Recording>;
    }>) => {
      const index = state.recordings.findIndex(
        (m): boolean => m.id === action.payload.id
      );
      if (index !== -1) {
        state.recordings[index] = { ...state.recordings[index], ...action.payload.updates };
      }
    },

    editRecordingData: (state: UserState, action: PayloadAction<{
        id: string;
        measurementId: string,
        updates: Partial<RecordingData>;
      }>) => {
      const recordingIndex = state.recordings.findIndex(
        (r): boolean => r.id === action.payload.id
      );
      if (recordingIndex == -1) return;
    
      const recording = state.recordings[recordingIndex];
      const dataIndex = recording.data.findIndex(
        (d): boolean => d.measurementId === action.payload.measurementId
      );

      if (dataIndex == -1) return;

      const nextData = [...state.recordings[recordingIndex].data];
      nextData[dataIndex] = { ...nextData[dataIndex], ...action.payload.updates };
      state.recordings[recordingIndex] = { ...state.recordings[recordingIndex], data: nextData };    
    },

    addHabit: (state: UserState, action: PayloadAction<Habit>) => {
      state.habits.push(action.payload);
    },
  

    removeHabit: (state: UserState, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(
        (h): boolean => h.id !== action.payload
      );
    },
  
    editHabit: (state: UserState, action: PayloadAction<{id: string, updates: Partial<Habit>}>) => {
      const index = state.habits.findIndex(
        (h): boolean => h.id === action.payload.id
      );
      if (index !== -1) {
        state.habits[index] = { ...state.habits[index], ...action.payload.updates };
      }
    },

   fetchUserStart: (state: UserState) => {
     state.loading = true;
     state.error = null;
    },
    
   fetchUserSuccess: (state: UserState, action: PayloadAction<User>) => {
     return { ...state, ...action.payload, loading: false, error: null };
    },

   fetchUserFailure: (state: UserState, action: PayloadAction<string>) => {
     state.loading = false;
     state.error = action.payload;
    },

   updateUserStart: (state: UserState) => {
     state.updating = true;
     state.error = null;
    },

   updateUserSuccess: (state: UserState, action: PayloadAction<User>) => {
     return { ...state, ...action.payload, updating: false, error: null };
    },

    updateUserFailure: (state: UserState, action: PayloadAction<string>) => {
      state.updating = false;
      state.error = action.payload;
    },
  },
});

export const {
  editName,
  editEmail,

  addMeasurement,
  removeMeasurement,
  editMeasurement,

  addRecording,
  addRecordings,
  editRecording,
  editRecordingData,

  addMeasurementUnit,
  removeMeasurementUnit,
  editMeasurementUnit,

  addHabit,
  removeHabit,
  editHabit,

  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,

  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
} = userStateSlice.actions;
export default userStateSlice.reducer;