import { generateId } from "@/utils/helpers";

/** @typedef {import('@t/users').User} User */

/**
 * @typedef {Object} RootState
 * @property {UserState} user
 */

/**
 * @typedef {User & {
 *  loading: ?boolean,
 *  updating: ?boolean,
 *  error: ?string,
 * }} UserState
 */

/**
 * 
 * @param {string=} name 
 * @param {string=} email
 * @returns {UserState}
 */
const createUserState = (name = 'Guest', email = '') => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  habits: [],

  loading: false,
  updating: false,
  error: null,
});

export { createUserState };