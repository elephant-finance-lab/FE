import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function AuthLoadingScreen() {
  return (
    <div className="screen flex items-center justify-center px-6">
      <p className="body-copy">로그인 상태를 확인하고 있어요.</p>
    </div>
  )
}

function ResetIncompleteAuth() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const didResetRef = useRef(false)

  useEffect(() => {
    if (didResetRef.current) return

    didResetRef.current = true
    void logout().finally(() => {
      navigate('/login', { replace: true })
    })
  }, [logout, navigate])

  return (
    <div className="screen flex items-center justify-center px-6">
      <p className="body-copy">가입을 다시 시작해주세요.</p>
    </div>
  )
}

export function RejectIncompleteAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated && !isProfileComplete) {
    return <ResetIncompleteAuth />
  }

  return children
}

interface RequireAuthProps {
  children: ReactNode
  requireProfileComplete?: boolean
}

export default function RequireAuth({ children, requireProfileComplete = false }: RequireAuthProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireProfileComplete && !isProfileComplete) {
    return <ResetIncompleteAuth />
  }

  return children
}
