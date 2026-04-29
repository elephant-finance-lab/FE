import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'

const initialAccounts = [
  { id: '1', number: '61300000000000', bank: 'KB국민은행' },
  { id: '2', number: '61300000000000', bank: '하나은행' },
  { id: '3', number: '61300000000000', bank: '신한은행' },
]

const STORAGE_KEY = 'linked-accounts'

function loadAccounts() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return initialAccounts
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : initialAccounts
  } catch {
    return initialAccounts
  }
}

export default function AccountPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState(loadAccounts)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const hasSelected = selectedIds.size > 0

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    if (!hasSelected) return
    setAccounts((prev) => {
      const next = prev.filter((account) => !selectedIds.has(account.id))
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setSelectedIds(new Set())
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[22px] pt-[30px] flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-[38px]">
          연결된 계좌 목록
        </h1>

        <div className="flex flex-col gap-6">
          {accounts.map((account) => {
            const selected = selectedIds.has(account.id)
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                className="flex items-center justify-between text-left active:bg-gray-50 rounded-xl transition-colors"
                aria-pressed={selected}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#D9D9D9] flex items-center justify-center text-gray-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="7" width="16" height="11" rx="2" />
                      <path d="M8 7V5h8v2" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[16px] font-medium leading-5 tracking-[0.02em] text-gray-900 tabular-nums">
                      {account.number}
                    </p>
                    <p className="text-[12px] leading-4 text-gray-700 mt-1.5">
                      {account.bank}
                    </p>
                  </div>
                </div>

                <span className={`w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-colors ${
                  selected
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4.5l3 3L11 1" />
                  </svg>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-[55px] flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/mypage/account/register')}
            className="h-11 px-7 rounded-[12px] bg-gray-100 text-gray-900 text-[16px] font-semibold leading-[1.2] active:bg-gray-200 transition-colors"
          >
            추가하기
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!hasSelected}
            className="h-11 px-7 rounded-[12px] bg-[rgba(100,100,100,0.8)] text-white text-[16px] font-semibold leading-[1.2] active:bg-[rgba(100,100,100,1)] disabled:opacity-40 disabled:pointer-events-none transition-opacity"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}
