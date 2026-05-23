import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyTerms, hasAgreedAllTerms } from '../../apis/auth'
import { useAuth } from '../../contexts/useAuth'
import { takeAuthRedirectPath } from '../../lib/authStorage'

function getTokenFromUrl(hash: string, search: string) {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(search)

  return (
    hashParams.get('token') ??
    hashParams.get('accessToken') ??
    searchParams.get('token') ??
    searchParams.get('accessToken')
  )
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { completeLogin } = useAuth()

  useEffect(() => {
    let isMounted = true
    const searchParams = new URLSearchParams(location.search)
    const oauthError = searchParams.get('error')
    const token = getTokenFromUrl(location.hash, location.search)

    if (oauthError || !token) {
      navigate('/login?error=oauth_failed', { replace: true })
      return () => {
        isMounted = false
      }
    }

    completeLogin(token).then(async (result) => {
      if (!isMounted) return

      if (result.needsProfileSetup) {
        const terms = await getMyTerms().catch(() => null)
        if (!isMounted) return

        navigate(hasAgreedAllTerms(terms) ? '/basic-info' : '/agreement', { replace: true })
        return
      }

      if (result.ok) {
        navigate(takeAuthRedirectPath('/chart'), { replace: true })
        return
      }

      navigate('/login?error=auth_failed', { replace: true })
    })

    return () => {
      isMounted = false
    }
  }, [completeLogin, location.hash, location.search, navigate])

  return (
    <div className="screen flex items-center justify-center px-6 text-center">
      <div className="animate-fade-in-up">
        <h1 className="section-title">로그인 처리 중</h1>
        <p className="body-copy mt-3">잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}
