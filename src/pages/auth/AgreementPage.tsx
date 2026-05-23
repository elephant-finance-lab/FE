import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  agreeAllTerms,
  getMyTerms,
  hasAgreedAllTerms,
  type TermsType,
} from '../../apis/auth'
import Button from '../../components/Button'

const agreements = [
  { id: 'INVESTMENT', label: '투자 관련 필수 약관', required: true },
  { id: 'TRADE_RISK', label: '자동매매 위험 고지 동의', required: true },
  { id: 'PRIVACY', label: '개인정보 처리방침', required: true },
  { id: 'SERVICE', label: '서비스 이용 약관', required: true },
] satisfies { id: TermsType; label: string; required: boolean }[]

function getAgreedTermIds(items: { termsType: TermsType; agreed: boolean }[]) {
  return new Set(items.filter((item) => item.agreed).map((item) => item.termsType))
}

function AgreementLoadingScreen() {
  return (
    <div className="screen flex items-center justify-center px-6">
      <p className="body-copy">약관 동의 상태를 확인하고 있어요.</p>
    </div>
  )
}

const errorMessage = '약관 동의를 저장하지 못했어요. 다시 시도해주세요.'

export default function AgreementPage() {
  const navigate = useNavigate()
  const [checked, setChecked] = useState<Set<TermsType>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const allChecked = agreements.every((a) => checked.has(a.id))

  useEffect(() => {
    let isMounted = true

    getMyTerms()
      .then((terms) => {
        if (!isMounted) return

        if (hasAgreedAllTerms(terms)) {
          navigate('/basic-info', { replace: true })
          return
        }

        setChecked(getAgreedTermIds(terms.items))
      })
      .catch(() => {
        if (!isMounted) return
        setSubmitError('약관 동의 상태를 확인하지 못했어요.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [navigate])

  const toggleAll = () => {
    if (allChecked) {
      setChecked(new Set())
    } else {
      setChecked(new Set(agreements.map((a) => a.id)))
      setShowError(false)
    }
    setSubmitError('')
  }

  const toggle = (id: TermsType) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
    setShowError(false)
    setSubmitError('')
  }

  const handleNext = async () => {
    if (!allChecked) {
      setShowError(true)
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError('')
      await agreeAllTerms()
      navigate('/basic-info')
    } catch {
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <AgreementLoadingScreen />
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
              disabled={isSubmitting}
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
        {submitError && (
          <p className="text-[13px] leading-5 text-error mt-4 ml-1 animate-fade-in-up">
            {submitError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-8">
        {!allChecked && (
          <Button onClick={toggleAll} variant="secondary" disabled={isSubmitting}>
            모두 동의하기
          </Button>
        )}
        <Button onClick={handleNext} disabled={isSubmitting}>
          {isSubmitting ? '저장 중' : '다음으로'}
        </Button>
      </div>
    </div>
  )
}
