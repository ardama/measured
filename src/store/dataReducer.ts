import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Habit, HabitUpdate } from '@t/habits';
import type { Measurement } from '@t/measurements';
import { createDataState, type DataState } from '@type/redux';

const initialState: DataState = createDataState();

const dataStateSlice = createSlice({
  name: 'dataState',
  initialState,
  reducers: {
    setMeasurements: (state: DataState, action: PayloadAction<Measurement[]>) => {
      state.measurements = [...action.payload].sort((a, b) => a.priority - b.priority);
    },
    setHabitUpdates: (state: DataState, action: PayloadAction<HabitUpdate[]>) => { state.habitUpdates = action.payload; },

    callCreateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callCreateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.create = action.payload; },
    callUpdateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callUpdateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.update = action.payload; },
    callDeleteMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callDeleteMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.delete = action.payload; },

    callCreateHabit: (_: DataState, __: PayloadAction<Habit>) => {},
    callCreateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.create = action.payload; },
    callUpdateHabit: (_: DataState, __: PayloadAction<Habit>) => {},
    callUpdateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.update = action.payload; },
    callDeleteHabit: (_: DataState, __: PayloadAction<Habit>) => {},
    callDeleteHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.delete = action.payload; },
  },
});

export const {
  setMeasurements,
  setHabitUpdates,

  callCreateMeasurement,
  callCreateMeasurementStatus,
  callUpdateMeasurement,
  callUpdateMeasurementStatus,
  callDeleteMeasurement,
  callDeleteMeasurementStatus,
 
  callCreateHabit,
  callCreateHabitStatus,
  callUpdateHabit,
  callUpdateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,
} = dataStateSlice.actions;
export default dataStateSlice.reducer;