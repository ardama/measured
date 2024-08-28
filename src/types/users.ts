import { generateId } from "@/utils/helpers";
import type { Habit } from '@t/habits';
import type { Measurement } from '@t/measurements';

interface User {
  id: string;
  name: string;
  email: string;
  measurements: Measurement[];
  habits: Habit[];
}

const createUser = (name: string = "Guest", email: string = ""): User => ({
  id: generateId(),
  name,
  email,
  measurements: [],
  habits: [],
});

export {
  type User,

  createUser,
}
