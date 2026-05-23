import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

function AuthLoadingScreen() {
  return (
    <div className="screen flex items-center justify-center px-6">
      <p className="body-copy">로그인 상태를 확인하고 있어요.</p>
    </div>
  )
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
    return <Navigate to="/basic-info" replace />
  }

  return children
}
