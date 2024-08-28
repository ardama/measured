import { generateId } from "@/utils/helpers";

/**
 * @typedef {Object} Habit
 * @property {string} id
 * @property {string} name
 * 
 * @property {HabitOperator} operator
 * @property {number} target
 * 
 * @property {import("@type/users").User} user
 * @property {import("@type/measurements").Measurement} measurement
 */

/**
 * @typedef {'>' | '<' | '>=' | '<=' | '==' | '!='} HabitOperator
 */

/**
 * 
 * @param {import("@type/users").User} user 
 * @param {import("@type/measurements").Measurement} measurement 
 * @param {string} name 
 * @param {HabitOperator} operator 
 * @param {number} target
 * @returns {Habit}
 */
const createHabit = (user, measurement, name, operator, target) => ({
  id: generateId(),
  user,
  measurement,
  name,
  operator,
  target,
});

export { createHabit };