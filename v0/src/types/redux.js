import { generateId } from "@/utils/helpers";

/** @typedef {import('@type/users').User} User */

/**
 * @typedef {Object} RootState
 * @property {AppState} app
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

/**
 * @typedef {Object} AppState
 * @property {number} activeTab
 */

/**
 * @returns {AppState}
 */
const createAppState = () => ({
  activeTab: 1,
});

export { createUserState, createAppState };