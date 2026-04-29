import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const suggestions = ['반도체', '엔터', '바이오', 'IT / AI', '금융', '소비재', '2차 전지', '기타']

const STORAGE_KEY = 'watchlist-groups'

function readGroups(): string[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return ['IT / AI']
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : ['IT / AI']
  } catch {
    return ['IT / AI']
  }
}

export default function AddGroupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = readGroups()
    if (!existing.includes(trimmed)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, trimmed]))
    }
    navigate('/watchlist')
  }

  const isValid = name.trim().length > 0

  return (
    <div className="screen flex flex-col min-h-dvh">
      <header className="px-6 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="w-9 h-9 -ml-2 flex items-center justify-center"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full h-10 text-[15px] leading-6 text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
            placeholder=""
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-x-2.5 gap-y-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal bg-[rgba(217,217,217,0.4)] text-gray-900 active:bg-[rgba(217,217,217,0.7)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[369px]">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full h-[60px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          확인
        </button>
      </div>
    </div>
  )
}
