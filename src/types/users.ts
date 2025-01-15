import type { BaseColor } from '@u/colors';
import { Collections } from '@u/constants/Firestore';
import { generateId } from '@u/helpers';
import type { User as AuthUser } from 'firebase/auth';

export type User = {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
}

export const serializeUser = (user: AuthUser): User => ({
  uid: user.uid,
  email: user.email,
  emailVerified: user.emailVerified,
  displayName: user.displayName,
  photoURL: user.photoURL,
  phoneNumber: user.phoneNumber,
})

export type UserClaims = {
  premiumExpiration?: string
}

export type Account = {
  id: string
  userId: string
  settings: AccountSettings
}

export type AccountSettings = {
  darkMode: boolean
  hue?: number
  baseColor?: BaseColor,
}

export const defaultAccount = (): Account => ({
  id: generateId(Collections.Accounts),
  userId: '',
  settings: {
    darkMode: true,
    baseColor: 'yellow',
  }
});