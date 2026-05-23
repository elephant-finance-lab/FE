import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getMyTerms, hasAgreedAllTerms } from '../apis/auth'
import { useAuth } from '../contexts/useAuth'

function AuthLoadingScreen() {
  return (
    <div className="screen flex items-center justify-center px-6">
      <p className="body-copy">로그인 상태를 확인하고 있어요.</p>
    </div>
  )
}

function IncompleteProfileRedirect() {
  const [nextPath, setNextPath] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    getMyTerms()
      .then((terms) => {
        if (!isMounted) return
        setNextPath(hasAgreedAllTerms(terms) ? '/basic-info' : '/agreement')
      })
      .catch(() => {
        if (!isMounted) return
        setNextPath('/agreement')
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (!nextPath) {
    return (
      <div className="screen flex items-center justify-center px-6">
        <p className="body-copy">가입 상태를 확인하고 있어요.</p>
      </div>
    )
  }

  return <Navigate to={nextPath} replace />
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
    return <IncompleteProfileRedirect />
  }

  return children
}
