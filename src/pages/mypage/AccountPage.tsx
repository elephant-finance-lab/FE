import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccount, getAccounts, type AccountInfo } from '../../apis/accounts'
import BackButton from '../../components/BackButton'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function AccountPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')

  const hasSelected = selectedIds.size > 0

  const refreshAccounts = useCallback(async () => {
    const result = await getAccounts()
    setAccounts(result)
    setSelectedIds(new Set())
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAccounts()
        .catch((error) => setMessage(errorMessage(error, '계좌 목록을 불러오지 못했어요.')))
        .finally(() => setIsLoading(false))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [refreshAccounts])

  const toggleAccount = (id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async () => {
    if (!hasSelected || isDeleting) return

    setIsDeleting(true)
    setMessage('')

    try {
      await Promise.all([...selectedIds].map((accountId) => deleteAccount(accountId)))
      await refreshAccounts()
    } catch (error) {
      setMessage(errorMessage(error, '계좌를 삭제하지 못했어요. 다시 시도해주세요.'))
      try {
        await refreshAccounts()
      } catch {
        // Keep the mutation failure visible if the follow-up refresh also fails.
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[22px] pt-[30px] flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-[38px]">
          계좌 관리
        </h1>

        {message && <p className="mb-5 text-[13px] leading-5 text-toss-red">{message}</p>}
        {isLoading && <p className="text-[14px] leading-5 text-gray-500">계좌 목록을 불러오고 있어요.</p>}
        {!isLoading && accounts.length === 0 && (
          <p className="text-[14px] leading-5 text-gray-500">연결된 계좌가 없습니다.</p>
        )}

        <div className="flex flex-col gap-6">
          {accounts.map((account) => {
            const selected = selectedIds.has(account.accountId)
            return (
              <button
                key={account.accountId}
                type="button"
                onClick={() => toggleAccount(account.accountId)}
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
                      {account.accountNumber}
                    </p>
                    <p className="text-[12px] leading-4 text-gray-700 mt-1.5">{account.bankName}</p>
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
            onClick={() => void handleDelete()}
            disabled={!hasSelected || isDeleting}
            className="h-11 px-7 rounded-[12px] bg-[rgba(100,100,100,0.8)] text-white text-[16px] font-semibold leading-[1.2] active:bg-[rgba(100,100,100,1)] disabled:opacity-40 disabled:pointer-events-none transition-opacity"
          >
            {isDeleting ? '삭제 중' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
