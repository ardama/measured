import { generateId } from "@/utils/helpers";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * 
 * @property {import("@type/measurements").Measurement[]} measurements
 * @property {import("@type/habits").Habit[]} habits
 */

/**
 * @param {string} name 
 * @param {string} email 
 * @returns {User}
 */
const createUser = (name = "Guest", email = "") => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  habits: [],
});


export { createUser };