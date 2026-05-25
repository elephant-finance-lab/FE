import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAccount, type AccountType } from '../../apis/accounts'
import BackButton from '../../components/BackButton'

export default function AccountRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    accountType: 'SECURITIES' as AccountType,
  })
  const [touched, setTouched] = useState({
    accountHolder: false,
    bankName: false,
    accountNumber: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const errors = useMemo(() => ({
    accountHolder: form.accountHolder.trim().length === 0 ? '예금주를 입력해주세요.' : '',
    bankName: form.bankName.trim().length === 0 ? '은행명을 입력해주세요.' : '',
    accountNumber: form.accountNumber.trim().length === 0 ? '계좌번호를 입력해주세요.' : '',
  }), [form])

  const isValid = !errors.accountHolder && !errors.bankName && !errors.accountNumber

  const handleSubmit = async () => {
    setTouched({ accountHolder: true, bankName: true, accountNumber: true })
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await createAccount(form)
      navigate('/mypage/account')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '계좌를 등록하지 못했어요. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[22px] pt-[37px] flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-[30px]">
          계좌 등록
        </h1>

        <div className="flex flex-col gap-[25px]">
          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">예금주</label>
            <input
              type="text"
              value={form.accountHolder}
              onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
              onBlur={() => setTouched((previous) => ({ ...previous, accountHolder: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.accountHolder && errors.accountHolder ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="예금주를 입력하세요"
            />
            {touched.accountHolder && errors.accountHolder && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.accountHolder}</p>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">은행명</label>
            <input
              type="text"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              onBlur={() => setTouched((previous) => ({ ...previous, bankName: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.bankName && errors.bankName ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="은행명을 입력하세요"
            />
            {touched.bankName && errors.bankName && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.bankName}</p>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">계좌 번호</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              onBlur={() => setTouched((previous) => ({ ...previous, accountNumber: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.accountNumber && errors.accountNumber ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="계좌번호를 입력하세요"
            />
            {touched.accountNumber && errors.accountNumber && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.accountNumber}</p>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">계좌 유형</label>
            <div className="relative">
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value as AccountType })}
                className="h-[52px] w-full appearance-none rounded-[13px] bg-gray-100/60 pl-5 pr-14 text-[16px] leading-6 text-gray-900 outline-none focus:bg-gray-100"
              >
                <option value="SECURITIES">증권 계좌</option>
                <option value="COMPREHENSIVE">종합 계좌</option>
              </select>
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-gray-500"
                width="12"
                height="7"
                viewBox="0 0 12 7"
                fill="none"
              >
                <path
                  d="M1 1L6 6L11 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-[55px] flex justify-center">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSubmitting}
            className="h-11 px-8 rounded-[12px] bg-[rgba(100,100,100,0.8)] text-white text-[16px] font-semibold leading-[1.2] active:bg-[rgba(100,100,100,1)] disabled:opacity-40 disabled:pointer-events-none transition-opacity"
          >
            {isSubmitting ? '등록 중' : '등록하기'}
          </button>
        </div>
        {submitError && (
          <p className="mt-3 text-center text-[13px] leading-5 text-toss-red">{submitError}</p>
        )}
      </div>
    </div>
  )
}
