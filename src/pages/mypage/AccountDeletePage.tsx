import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
}

const initialAccounts: BankAccount[] = [
  { id: 'a1', bankName: 'KB국민은행', accountNumber: '61300000000000' },
  { id: 'a2', bankName: '하나은행', accountNumber: '61300000000000' },
  { id: 'a3', bankName: '신한은행', accountNumber: '61300000000000' },
]

export default function AccountDeletePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialAccounts.map((a) => a.id)))

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleDelete = () => {
    if (selected.size === 0) return
    navigate('/mypage')
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[22px] pt-12 flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-9">연결된 계좌 목록</h1>

        <ul className="flex flex-col gap-3">
          {initialAccounts.map((account) => {
            const isSelected = selected.has(account.id)
            return (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => toggle(account.id)}
                  className="flex w-full items-center gap-[15px] py-2 active:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[12px] font-semibold text-gray-500 shrink-0">
                    {account.bankName.slice(0, 1)}
                  </span>
                  <span className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-[18px] font-semibold leading-6 text-gray-900 truncate w-full">{account.accountNumber}</span>
                    <span className="text-[13px] font-light leading-4 text-gray-500 mt-1">{account.bankName}</span>
                  </span>
                  <span
                    className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-toss-blue border-toss-blue' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="pt-12 flex justify-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={selected.size === 0}
            className="h-10 px-6 rounded-[10px] bg-[rgba(100,100,100,0.8)] text-white text-[15px] font-semibold leading-[1.2] active:bg-[rgba(100,100,100,1)] disabled:opacity-40"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  )
}
