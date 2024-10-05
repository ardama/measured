import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Habit, HabitUpdate } from '@t/habits';
import type { Measurement, MeasurementUnit } from '@t/measurements';
import type { Recording, RecordingData } from '@t/recording';
import type { User } from '@t/users';
import { createUserState, generateTestUser, type UserState } from '@type/redux';
import { generateId } from '@u/helpers';

const initialState: UserState = generateTestUser();

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

    addRecording: (state: UserState, action: PayloadAction<Recording>) => {
      state.recordings.push(action.payload);
      state.recordings.sort(({ date: aDate }, { date: bDate} ) => aDate < bDate ? -1 : 1);
    },
    
    addRecordings: (state: UserState, action: PayloadAction<Recording[]>) => {
      state.recordings.push(...action.payload);
      state.recordings.sort(({ date: aDate }, { date: bDate} ) => aDate < bDate ? -1 : 1);
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

    addHabitUpdate: (state: UserState, action: PayloadAction<HabitUpdate>) => {
      state.habitUpdates.push(action.payload);
    },
  
    removeHabitUpdate: (state: UserState, action: PayloadAction<string>) => {
      state.habitUpdates = state.habitUpdates.filter(
        (h): boolean => h.id !== action.payload
      );
    },

    removeHabitUpdates: (state: UserState, action: PayloadAction<string>) => {
      state.habitUpdates = state.habitUpdates.filter(
        (h): boolean => h.habitId !== action.payload
      );
    },
  
    editHabitUpdate: (state: UserState, action: PayloadAction<{id: string, updates: Partial<HabitUpdate>}>) => {
      const index = state.habitUpdates.findIndex(
        (h): boolean => h.id === action.payload.id
      );
      if (index !== -1) {
        state.habitUpdates[index] = { ...state.habitUpdates[index], ...action.payload.updates };
      }
    },

    replaceHabitUpdate: (state: UserState, action: PayloadAction<{id: string, habitUpdate: HabitUpdate}>) => {
      const index = state.habitUpdates.findIndex(
        (h): boolean => h.id === action.payload.id
      );
      if (index !== -1) {
        state.habitUpdates[index] = { ...action.payload.habitUpdate, id: action.payload.id };
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

  addHabitUpdate,
  removeHabitUpdate,
  editHabitUpdate,
  replaceHabitUpdate,
  removeHabitUpdates,

  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,

  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
} = userStateSlice.actions;
export default userStateSlice.reducer;