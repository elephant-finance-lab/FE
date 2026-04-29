import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

const agreements = [
  { id: 'invest', label: '투자 관련 필수 약관', required: true },
  { id: 'auto-trade', label: '자동매매 위험 고지 동의', required: true },
  { id: 'privacy', label: '개인정보 처리방침', required: true },
  { id: 'terms', label: '서비스 이용 약관', required: true },
]

export default function AgreementPage() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [showError, setShowError] = useState(false)

  const allChecked = agreements.every((a) => checked.has(a.id))

  const toggleAll = () => {
    if (allChecked) {
      setChecked(new Set())
    } else {
      setChecked(new Set(agreements.map((a) => a.id)))
      setShowError(false)
    }
  }

  const toggle = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
    setShowError(false)
  }

  const handleNext = () => {
    if (!allChecked) {
      setShowError(true)
      return
    }
    navigate('/basic-info')
  }

  return (
    <div className="screen flex flex-col px-6 pt-[72px] pb-10">
      <div className="flex-1 animate-fade-in-up">
        <h1 className="section-title whitespace-pre-line">
          {'회원가입을 하려면\n동의가 필요해요'}
        </h1>
        <p className="body-copy mt-3">모든 필수 약관에 동의해주세요.</p>

        <div className="mt-10 flex flex-col gap-3">
          {agreements.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`flex items-center gap-3 h-[56px] px-4 rounded-[14px] text-left transition-all border ${
                checked.has(item.id)
                  ? 'border-toss-blue bg-toss-blue-light'
                  : showError && item.required
                    ? 'border-error bg-red-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <span className={`flex items-center justify-center w-[22px] h-[22px] rounded-full border-2 shrink-0 transition-colors ${
                checked.has(item.id) ? 'border-toss-blue bg-toss-blue' : 'border-gray-300'
              }`}>
                {checked.has(item.id) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-[15px] font-medium leading-6 ${checked.has(item.id) ? 'text-toss-blue' : 'text-gray-800'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {showError && (
          <p className="text-[13px] leading-5 text-error mt-4 ml-1 animate-fade-in-up">
            모든 필수 약관에 동의해주세요.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-8">
        {!allChecked && (
          <Button onClick={toggleAll} variant="secondary">
            모두 동의하기
          </Button>
        )}
        <Button onClick={handleNext} disabled={false}>
          다음으로
        </Button>
      </div>
    </div>
  )
}
