import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="screen flex flex-col px-6 pt-[84px] pb-10">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-14 text-center animate-fade-in-up">
          <img
            src="/logo.png"
            alt="코끼리 로고"
            className="mx-auto mb-6 h-20 w-20 rounded-[22px] object-cover shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          />
          <p className="text-toss-blue font-medium text-[14px] leading-5 mb-2">코끼리</p>
          <h1 className="section-title">로그인</h1>
          <p className="body-copy mt-3">AI 기반 맞춤형 주식 투자를 시작하세요</p>
        </div>

        <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <Button
            variant="google"
            onClick={() => navigate('/agreement')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            }
          >
            Google로 로그인
          </Button>

          <Button
            variant="kakao"
            onClick={() => navigate('/agreement')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.2 4.39 5.08-3.35c.48.05.97.07 1.46.07 5.52 0 10-3.58 10-7.78S17.52 3 12 3z"/>
              </svg>
            }
          >
            카카오로 로그인
          </Button>

          <Button
            variant="naver"
            onClick={() => navigate('/agreement')}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16.27 12.97L7.44 3H3v18h4.73V11.03L16.56 21H21V3h-4.73z"/>
              </svg>
            }
          >
            네이버로 로그인
          </Button>
        </div>
      </div>
    </div>
  )
}
