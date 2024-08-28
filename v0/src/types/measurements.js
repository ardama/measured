import { generateId } from "@/utils/helpers";

/**
 * @typedef {Object} Measurement
 * @property {string} id
 * @property {MeasurementType} type
 * @property {string} activity
 * @property {string} variant
 * @property {MeasurementUnit} unit
 * @property {number} step
 * 
 * @property {import("@type/users").User} user
 * @property {{date: Date, recording: MeasurementRecording}[]} recordings
 */

/**
 * 
 * @param {import("@type/users").User} user 
 * @param {string} activity 
 * @param {string} variant 
 * @param {MeasurementType} type 
 * @param {MeasurementUnit} unit 
 * @param {number} step 
 * @returns {Measurement}
 */
const createMeasurement = (user, activity, variant, type, unit, step) => ({
  id: generateId(),
  user,
  activity,
  variant,
  type,
  unit,
  step,
  recordings: [],
});

/**
 * @typedef {Object} MeasurementUnit
 * @property {string} id
 * @property {string} label
 * @property {string} abbreviation
 * @property {MeasurementType[]} types
 */

/**
 * 
 * @param {string} label 
 * @param {string} abbreviation 
 * @returns {MeasurementUnit}
 */
const createMeasurementUnit = (label, abbreviation) => ({
  id: generateId(),
  label,
  abbreviation,
  types: [],
});

/**
 * @typedef {Object} MeasurementRecording
 * @property {string} id
 * @property {Date} date
 * @property {number} value
 */

/**
 * 
 * @param {Date} date 
 * @param {number} value 
 * @returns {MeasurementRecording}
 */
const createMeasurementRecording = (date, value) => ({
  id: generateId(),
  date,
  value,
});

/**
 * @typedef {'duration' | 'time' | 'count' | 'bool'} MeasurementType
 */

export { createMeasurement, createMeasurementUnit, createMeasurementRecording };