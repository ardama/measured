import type { User as AuthUser } from 'firebase/auth';

type User = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
}

export {
  type User,
}

export const serializeUser = (user: AuthUser): User => ({
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
  displayName: user.displayName,
  photoURL: user.photoURL,
  phoneNumber: user.phoneNumber,
})