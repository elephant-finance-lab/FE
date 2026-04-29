import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AnalyzingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/recommend')
    }, 4000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="screen flex flex-col items-center justify-center px-7">
      <div className="relative mb-10 animate-fade-in-up">
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none" className="animate-pulse-slow">
          {/* tree trunk */}
          <rect x="55" y="85" width="10" height="30" rx="3" fill="#8B6914" opacity="0.7" />
          {/* tree foliage */}
          <ellipse cx="60" cy="60" rx="35" ry="40" fill="#34C759" opacity="0.2" />
          <ellipse cx="60" cy="55" rx="28" ry="32" fill="#34C759" opacity="0.35" />
          <ellipse cx="60" cy="50" rx="20" ry="24" fill="#34C759" opacity="0.5" />
          {/* elephant body */}
          <ellipse cx="60" cy="105" rx="22" ry="16" fill="#3182F6" opacity="0.85" />
          {/* elephant head */}
          <circle cx="60" cy="88" r="14" fill="#3182F6" />
          {/* elephant ears */}
          <ellipse cx="44" cy="84" rx="8" ry="10" fill="#3182F6" opacity="0.7" />
          <ellipse cx="76" cy="84" rx="8" ry="10" fill="#3182F6" opacity="0.7" />
          {/* elephant eyes */}
          <circle cx="55" cy="86" r="2.5" fill="white" />
          <circle cx="65" cy="86" r="2.5" fill="white" />
          <circle cx="55.5" cy="86.5" r="1.2" fill="#191F28" />
          <circle cx="65.5" cy="86.5" r="1.2" fill="#191F28" />
          {/* elephant trunk */}
          <path d="M60 94 Q60 102 55 106 Q53 108 55 108 Q58 108 60 104 Q62 108 65 108 Q67 108 65 106 Q60 102 60 94" fill="#2272EB" />
          {/* coins */}
          <g className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '2s' }}>
            <circle cx="95" cy="95" r="9" fill="#FFD700" opacity="0.9" />
            <text x="95" y="99" textAnchor="middle" fontSize="10" fill="#8B6914" fontWeight="bold">$</text>
          </g>
          <g className="animate-bounce" style={{ animationDelay: '400ms', animationDuration: '2.2s' }}>
            <circle cx="25" cy="100" r="7" fill="#FFD700" opacity="0.8" />
            <text x="25" y="103.5" textAnchor="middle" fontSize="8" fill="#8B6914" fontWeight="bold">₩</text>
          </g>
          <g className="animate-bounce" style={{ animationDelay: '800ms', animationDuration: '1.8s' }}>
            <circle cx="100" cy="70" r="6" fill="#FFD700" opacity="0.7" />
            <text x="100" y="73" textAnchor="middle" fontSize="7" fill="#8B6914" fontWeight="bold">$</text>
          </g>
        </svg>
      </div>

      <h1 className="text-[40px] font-semibold leading-[1.2] text-gray-900 text-center animate-fade-in-up">
        분석중
      </h1>
      <p className="body-copy mt-4 text-center whitespace-pre-line animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        AI가 사용자 성향에 맞는{'\n'}종목을 분석하고 있습니다
      </p>

      <div className="flex items-center gap-1.5 mt-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-toss-blue animate-pulse-slow"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>

      <div className="mt-8 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-toss-blue rounded-full animate-[progress_4s_ease-in-out_forwards]" />
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
