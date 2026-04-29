import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'

const STORAGE_KEY = 'linked-accounts'

interface Account {
  id: string
  holderName: string
  bank: string
  number: string
}

const initialAccounts: Account[] = [
  { id: '1', holderName: '김이박', number: '61300000000000', bank: 'KB국민은행' },
  { id: '2', holderName: '김이박', number: '61300000000000', bank: '하나은행' },
  { id: '3', holderName: '김이박', number: '61300000000000', bank: '신한은행' },
]

function loadAccounts(): Account[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return initialAccounts
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : initialAccounts
  } catch {
    return initialAccounts
  }
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export default function AccountRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ holderName: '', bank: '', accountNumber: '' })
  const [touched, setTouched] = useState({ holderName: false, bank: false, accountNumber: false })

  const errors = useMemo(() => {
    const holderName = form.holderName.trim()
    const bank = form.bank.trim()
    const accountNumber = onlyDigits(form.accountNumber)

    return {
      holderName:
        holderName.length === 0
          ? '예금주를 입력해주세요.'
          : !/^[가-힣a-zA-Z\s]{2,20}$/.test(holderName)
            ? '예금주는 한글/영문 2~20자로 입력해주세요.'
            : '',
      bank:
        bank.length === 0
          ? '은행명을 입력해주세요.'
          : !/^[가-힣a-zA-Z\s]{2,20}$/.test(bank)
            ? '은행명은 한글/영문 2~20자로 입력해주세요.'
            : '',
      accountNumber:
        accountNumber.length === 0
          ? '계좌번호를 입력해주세요.'
          : accountNumber.length < 10 || accountNumber.length > 16
            ? '계좌번호는 숫자 10~16자리로 입력해주세요.'
            : '',
    }
  }, [form])

  const isValid = !errors.holderName && !errors.bank && !errors.accountNumber

  const handleSubmit = () => {
    setTouched({ holderName: true, bank: true, accountNumber: true })
    if (!isValid) return

    const accounts = loadAccounts()
    const next = [
      ...accounts,
      {
        id: `${Date.now()}`,
        holderName: form.holderName.trim(),
        bank: form.bank.trim(),
        number: onlyDigits(form.accountNumber),
      },
    ]
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    navigate('/mypage/account')
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
              value={form.holderName}
              onChange={(e) => setForm({ ...form, holderName: e.target.value })}
              onBlur={() => setTouched((prev) => ({ ...prev, holderName: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.holderName && errors.holderName ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="예금주를 입력하세요"
            />
            {touched.holderName && errors.holderName && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.holderName}</p>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">은행명</label>
            <input
              type="text"
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              onBlur={() => setTouched((prev) => ({ ...prev, bank: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.bank && errors.bank ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="은행명을 입력하세요"
            />
            {touched.bank && errors.bank && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.bank}</p>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label className="text-[15px] font-light leading-[1.2] text-gray-900">계좌 번호</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: onlyDigits(e.target.value) })}
              onBlur={() => setTouched((prev) => ({ ...prev, accountNumber: true }))}
              className={`h-[52px] w-full rounded-[13px] bg-gray-100/60 px-5 text-[16px] leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:bg-gray-100 ${
                touched.accountNumber && errors.accountNumber ? 'ring-1 ring-toss-red' : ''
              }`}
              placeholder="계좌번호를 입력하세요"
            />
            {touched.accountNumber && errors.accountNumber && (
              <p className="text-[11px] leading-4 text-toss-red">{errors.accountNumber}</p>
            )}
          </div>
        </div>

        <div className="mt-[55px] flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="h-11 px-8 rounded-[12px] bg-[rgba(100,100,100,0.8)] text-white text-[16px] font-semibold leading-[1.2] active:bg-[rgba(100,100,100,1)] disabled:opacity-40 disabled:pointer-events-none transition-opacity"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  )
}
