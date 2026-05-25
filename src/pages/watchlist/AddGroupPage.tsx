import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWatchlistGroup } from '../../apis/watchlist'

const suggestions = ['반도체', '엔터', '바이오', 'IT / AI', '금융', '소비재', '2차 전지', '기타']

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '그룹 생성에 실패했습니다.'
}

export default function AddGroupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleConfirm = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 50 || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createWatchlistGroup({ name: trimmed })
      if (!isMountedRef.current) return
      navigate('/watchlist', { replace: true })
    } catch (requestError) {
      if (!isMountedRef.current) return
      setError(errorMessage(requestError))
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  const isValid = name.trim().length > 0 && name.trim().length <= 50

  return (
    <div className="screen flex flex-col min-h-dvh">
      <header className="px-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          aria-label="뒤로"
          className="w-9 h-9 -ml-2 flex items-center justify-center disabled:opacity-40"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#191F28"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </header>

      <main className="flex-1 px-6 pt-6 pb-[120px]">
        <p className="text-[13px] leading-5 text-gray-500">어떤 주제로 그룹을 만들까요?</p>

        <div className="mt-8 border-b-2 border-black">
          <input
            type="text"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full h-10 text-[15px] leading-6 text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            placeholder=""
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-2.5 gap-y-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setName(suggestion)}
              className="h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal bg-[rgba(217,217,217,0.4)] text-gray-900 active:bg-[rgba(217,217,217,0.7)] transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-[13px] leading-5 text-error">{error}</p>}
      </main>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[369px]">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={!isValid || isSubmitting}
          className="w-full h-[60px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '생성 중' : '확인'}
        </button>
      </div>
    </div>
  )
}
