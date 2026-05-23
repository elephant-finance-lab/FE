import { createContext } from 'react'
import type { SocialProvider, UserProfile } from '../apis/auth'

export interface AuthUser {
  userId: string
  profile: UserProfile | null
}

export interface AuthContextValue {
  isAuthenticated: boolean
  isProfileComplete: boolean
  user: AuthUser | null
  isLoading: boolean
  login: (provider: SocialProvider, redirectTo?: string) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  completeLogin: (accessToken: string) => Promise<AuthLoginResult>
}

export interface AuthLoginResult {
  ok: boolean
  needsProfileSetup: boolean
}

export function hasCompleteProfile(user: AuthUser | null) {
  return Boolean(user?.profile?.phone && user.profile.gender)
}

export const AuthContext = createContext<AuthContextValue | null>(null)
