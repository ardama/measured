import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ComputedHabit, Habit, HabitUpdate } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { Account } from '@t/users';
import { createDataState, type DataState } from '@type/redux';

const initialState: DataState = createDataState();

const dataStateSlice = createSlice({
  name: 'dataState',
  initialState,
  reducers: {
    setMeasurements: (state: DataState, action: PayloadAction<Measurement[]>) => {
      state.measurements = [...action.payload].sort((a, b) => a.priority - b.priority);
      state.dataLoaded = true;
    },
    setHabits: (state: DataState, action: PayloadAction<Habit[]>) => {
      state.habits = action.payload;
      state.dataLoaded = true;
    },
    setAccount: (state: DataState, action: PayloadAction<Account[]>) => {
      if (action.payload.length) state.account = action.payload[0];
      state.dataLoaded = true;
    },

    callCreateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callCreateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.create = action.payload; },
    callUpdateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callUpdateMeasurements: (_: DataState, __: PayloadAction<Measurement[]>) => {},
    callUpdateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.update = action.payload; },
    callDeleteMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callDeleteMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.delete = action.payload; },

    callCreateHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callCreateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.create = action.payload; },
    callUpdateHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callUpdateHabits: (_: DataState, __: PayloadAction<ComputedHabit[]>) => {},
    callUpdateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.update = action.payload; },
    callDeleteHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callDeleteHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.delete = action.payload; },
    
    callUpdateAccount: (_: DataState, __: PayloadAction<Account>) => {},
    callUpdateAccountStatus: (state: DataState, action: PayloadAction<string>) => { state.accountStatus.update = action.payload; },
  },
});

export const {
  setMeasurements,
  setHabits,
  setAccount,

  callCreateMeasurement,
  callCreateMeasurementStatus,
  callUpdateMeasurement,
  callUpdateMeasurements,
  callUpdateMeasurementStatus,
  callDeleteMeasurement,
  callDeleteMeasurementStatus,
 
  callCreateHabit,
  callCreateHabitStatus,
  callUpdateHabit,
  callUpdateHabits,
  callUpdateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,

  callUpdateAccount,
  callUpdateAccountStatus,

} = dataStateSlice.actions;
export default dataStateSlice.reducer;