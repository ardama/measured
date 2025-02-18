import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ComputedHabit, Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';
import type { Account } from '@t/users';
import { createDataState, type DataState } from '@type/redux';

const initialState: DataState = createDataState();

const dataStateSlice = createSlice({
  name: 'dataState',
  initialState,
  reducers: {
    resetData: (_: DataState) => {
      return createDataState();
    },
    setMeasurements: (state: DataState, action: PayloadAction<Measurement[]>) => {
      state.measurements = [...action.payload]
        .map((measurement) => {
          if (!measurement.category && !!measurement.variant) {
            return { ...measurement, category: measurement.name, name: measurement.variant, variant: undefined };
          }
          return measurement;
        })
        .sort((a, b) => a.priority - b.priority);
      state.dataLoaded |= 1;
    },
    setHabits: (state: DataState, action: PayloadAction<Habit[]>) => {
      state.habits = action.payload;
      state.dataLoaded |= 2;
    },
    setAccount: (state: DataState, action: PayloadAction<Account[]>) => {
      if (action.payload.length) state.account = action.payload[0];
      state.dataLoaded |= 4;
    },

    callCreateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callCreateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.create = action.payload; },
    callCreateMeasurements: (_: DataState, __: PayloadAction<Measurement[]>) => {},
    callCreateMeasurementsStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.create = action.payload; },
    callUpdateMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callUpdateMeasurements: (_: DataState, __: PayloadAction<Measurement[]>) => {},
    callUpdateMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.update = action.payload; },
    callDeleteMeasurement: (_: DataState, __: PayloadAction<Measurement>) => {},
    callDeleteMeasurementStatus: (state: DataState, action: PayloadAction<string>) => { state.measurementStatus.delete = action.payload; },

    callCreateHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callCreateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.create = action.payload; },
    callCreateHabits: (_: DataState, __: PayloadAction<ComputedHabit[]>) => {},
    callCreateHabitsStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.create = action.payload; },
    callUpdateHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callUpdateHabits: (_: DataState, __: PayloadAction<ComputedHabit[]>) => {},
    callUpdateHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.update = action.payload; },
    callDeleteHabit: (_: DataState, __: PayloadAction<ComputedHabit>) => {},
    callDeleteHabitStatus: (state: DataState, action: PayloadAction<string>) => { state.habitStatus.delete = action.payload; },
    
    callUpdateAccount: (_: DataState, __: PayloadAction<Account>) => {},
    callUpdateAccountStatus: (state: DataState, action: PayloadAction<string>) => { state.accountStatus.update = action.payload; },

    callDeleteAll: (_: DataState) => {},
    callDeleteAllStatus: (state: DataState, action: PayloadAction<string>) => { state.deleteAllStatus = action.payload; },

    callGenerateSampleData: (_: DataState) => {},
  },
});

export const {
  resetData,

  setMeasurements,
  setHabits,
  setAccount,

  callCreateMeasurement,
  callCreateMeasurementStatus,
  callCreateMeasurements,
  callCreateMeasurementsStatus,
  callUpdateMeasurement,
  callUpdateMeasurements,
  callUpdateMeasurementStatus,
  callDeleteMeasurement,
  callDeleteMeasurementStatus,
 
  callCreateHabit,
  callCreateHabitStatus,
  callCreateHabits,
  callCreateHabitsStatus,
  callUpdateHabit,
  callUpdateHabits,
  callUpdateHabitStatus,
  callDeleteHabit,
  callDeleteHabitStatus,

  callUpdateAccount,
  callUpdateAccountStatus,

  callDeleteAll,
  callDeleteAllStatus,

  callGenerateSampleData,
} = dataStateSlice.actions;

export const dataActions = new Set([
  callCreateMeasurement.type,
  callCreateMeasurements.type,
  callUpdateMeasurement.type,
  callDeleteMeasurement.type,

  callCreateHabit.type,
  callCreateHabits.type,
  callUpdateHabit.type,
  callUpdateHabits.type,
  callDeleteHabit.type,

  callUpdateAccount.type,
  
  callDeleteAll.type,

  callGenerateSampleData.type,
]);

export default dataStateSlice.reducer;
