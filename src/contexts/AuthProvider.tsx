import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getAuthMe,
  getMyProfile,
  getOAuthLoginUrl,
  logoutApi,
  type SocialProvider,
} from '../apis/auth'
import { reissueAccessToken } from '../lib/apiClient'
import {
  clearAccessToken,
  getAccessToken,
  saveAuthRedirectPath,
  setAccessToken,
} from '../lib/authStorage'
import {
  AuthContext,
  hasCompleteProfile,
  type AuthContextValue,
  type AuthUser,
} from './authContextValue'

async function fetchCurrentUser(): Promise<AuthUser> {
  const me = await getAuthMe()
  const profile = await getMyProfile().catch(() => null)

  return {
    userId: me.userId,
    profile,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    setIsLoading(true)

    try {
      if (!getAccessToken()) {
        const refreshedToken = await reissueAccessToken()
        if (!refreshedToken) {
          throw new Error('No access token')
        }
      }

      const nextUser = await fetchCurrentUser()
      setUser(nextUser)
      return true
    } catch {
      clearAccessToken()
      setUser(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const completeLogin = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken)
      setIsLoading(true)

      try {
        const nextUser = await fetchCurrentUser()
        setUser(nextUser)

        return {
          ok: true,
          needsProfileSetup: !hasCompleteProfile(nextUser),
        }
      } catch {
        clearAccessToken()
        setUser(null)

        return {
          ok: false,
          needsProfileSetup: false,
        }
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const login = useCallback((provider: SocialProvider, redirectTo = '/chart') => {
    clearAccessToken()
    saveAuthRedirectPath(redirectTo)
    window.location.assign(getOAuthLoginUrl(provider))
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Local state is cleared even if the server-side logout request is already expired.
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      return undefined
    }

    const timer = window.setTimeout(() => {
      void checkAuth()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [checkAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      isProfileComplete: hasCompleteProfile(user),
      user,
      isLoading,
      login,
      logout,
      checkAuth,
      completeLogin,
    }),
    [checkAuth, completeLogin, isLoading, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
