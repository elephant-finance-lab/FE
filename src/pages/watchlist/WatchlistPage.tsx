import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { getStockSummary, type StockSummary } from '../../apis/stocks'
import {
  deleteWatchlistGroup,
  getWatchlistGroups,
  removeWatchlistItem,
  updateWatchlistGroup,
  type WatchlistGroup,
  type WatchlistItem,
} from '../../apis/watchlist'
import { resolveStockDisplayName } from '../../lib/stockDisplay'

type ModalState = 'closed' | 'edit' | 'confirm-delete'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리에 실패했습니다.'
}

function formatPrice(price: number) {
  return `${Number(price).toLocaleString('ko-KR')}원`
}

function formatChangeRate(rate: number) {
  const value = Number(rate)
  if (!Number.isFinite(value)) return '-'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR')}%`
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} aria-hidden="true" />
}

function WatchlistSkeleton() {
  return (
    <>
      <div className="pt-4 pb-6 px-[27px] flex items-center gap-2.5">
        <Skeleton className="h-[30px] w-[72px] rounded-[7px]" />
        <Skeleton className="h-[30px] w-[64px] rounded-[7px]" />
        <Skeleton className="ml-auto h-5 w-14" />
      </div>
      <div className="pl-[33px] pr-[16px] flex flex-col gap-7">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-6 w-[44%]" />
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        ))}
      </div>
    </>
  )
}

interface GroupRowProps {
  group: WatchlistGroup
  isEditing: boolean
  isBusy: boolean
  editingValue: string
  setEditingValue: (value: string) => void
  onAskDelete: (group: WatchlistGroup) => void
  onStartEdit: (group: WatchlistGroup) => void
  onCommitEdit: () => void
  onCancelEdit: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

function GroupRow({
  group,
  isEditing,
  isBusy,
  editingValue,
  setEditingValue,
  onAskDelete,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  inputRef,
}: GroupRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button
        type="button"
        onClick={() => onAskDelete(group)}
        disabled={isBusy}
        aria-label="삭제"
        className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-500 shrink-0 disabled:opacity-50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingValue}
          maxLength={50}
          disabled={isBusy}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onCommitEdit()
            }
            if (e.key === 'Escape') {
              onCancelEdit()
            }
          }}
          className="flex-1 text-[15px] font-medium text-gray-900 bg-transparent border-b border-gray-400 outline-none px-0 py-0.5"
        />
      ) : (
        <span className="text-[15px] font-medium text-gray-900">{group.name}</span>
      )}

      <button
        type="button"
        onMouseDown={(e) => {
          if (isEditing) e.preventDefault()
        }}
        onClick={() => (isEditing ? onCommitEdit() : onStartEdit(group))}
        disabled={isBusy}
        aria-label={isEditing ? '저장' : '편집'}
        className="w-5 h-5 flex items-center justify-center text-gray-500 shrink-0 disabled:opacity-50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

    </div>
  )
}

export default function WatchlistPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<WatchlistGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [summaries, setSummaries] = useState<Record<string, StockSummary | null>>({})
  const [isSummariesLoading, setIsSummariesLoading] = useState(false)
  const [modalState, setModalState] = useState<ModalState>('closed')
  const [deletingGroup, setDeletingGroup] = useState<WatchlistGroup | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null)
  const [pendingItemTicker, setPendingItemTicker] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement | null>(null)
  const groupsRequestIdRef = useRef(0)
  const isMutationPending = pendingGroupId !== null || pendingItemTicker !== null

  const loadGroups = useCallback(async (preferredGroupId?: number | null) => {
    const requestId = ++groupsRequestIdRef.current

    setIsLoading(true)
    setLoadError(null)

    try {
      const result = await getWatchlistGroups()
      if (requestId !== groupsRequestIdRef.current) return
      setGroups(result.groups)
      setActiveGroupId((currentGroupId) => {
        const selectedId = preferredGroupId ?? currentGroupId
        const selectedExists = result.groups.some((group) => group.groupId === selectedId)
        return selectedExists ? selectedId : (result.groups[0]?.groupId ?? null)
      })
    } catch (error) {
      if (requestId !== groupsRequestIdRef.current) return
      setLoadError(errorMessage(error))
    } finally {
      if (requestId === groupsRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroups()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      groupsRequestIdRef.current += 1
    }
  }, [loadGroups])

  const activeGroup = groups.find((group) => group.groupId === activeGroupId) ?? null

  useEffect(() => {
    const tickers = Array.from(new Set(activeGroup?.items.map((item) => item.ticker) ?? []))
    let isCurrent = true

    const timer = window.setTimeout(() => {
      setSummaries({})
      if (tickers.length === 0) {
        setIsSummariesLoading(false)
        return
      }

      setIsSummariesLoading(true)
      void Promise.all(
        tickers.map(async (ticker) => {
          try {
            return [ticker, await getStockSummary(ticker)] as const
          } catch {
            return [ticker, null] as const
          }
        }),
      ).then((results) => {
        if (!isCurrent) return
        setSummaries(Object.fromEntries(results))
        setIsSummariesLoading(false)
      })
    }, 0)

    return () => {
      isCurrent = false
      window.clearTimeout(timer)
    }
  }, [activeGroup])

  useEffect(() => {
    if (modalState === 'closed') return
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [modalState])

  useEffect(() => {
    if (editingGroupId !== null && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingGroupId])

  const handleRemoveStock = async (item: WatchlistItem) => {
    if (!activeGroup || isMutationPending) return

    setPendingItemTicker(item.ticker)
    setMutationError(null)

    try {
      await removeWatchlistItem({ groupId: activeGroup.groupId, ticker: item.ticker })
      await loadGroups(activeGroup.groupId)
    } catch (error) {
      setMutationError(errorMessage(error))
    } finally {
      setPendingItemTicker(null)
    }
  }

  const closeModal = () => {
    setModalState('closed')
    setDeletingGroup(null)
    setEditingGroupId(null)
  }

  const dismissModal = () => {
    if (isMutationPending) return
    closeModal()
  }

  const askDelete = (group: WatchlistGroup) => {
    if (isMutationPending) return
    setMutationError(null)
    setDeletingGroup(group)
    setModalState('confirm-delete')
  }

  const confirmDelete = async () => {
    if (!deletingGroup || isMutationPending) return

    setPendingGroupId(deletingGroup.groupId)
    setMutationError(null)

    try {
      await deleteWatchlistGroup(deletingGroup.groupId)
      await loadGroups(activeGroupId)
      closeModal()
    } catch (error) {
      setMutationError(errorMessage(error))
    } finally {
      setPendingGroupId(null)
    }
  }

  const startEdit = (group: WatchlistGroup) => {
    if (isMutationPending) return
    setMutationError(null)
    setEditingGroupId(group.groupId)
    setEditingValue(group.name)
  }

  const cancelEdit = () => {
    setEditingGroupId(null)
  }

  const commitEdit = async () => {
    if (editingGroupId === null || isMutationPending) return

    const groupId = editingGroupId
    const currentGroup = groups.find((group) => group.groupId === groupId)
    const name = editingValue.trim()
    setEditingGroupId(null)

    if (!currentGroup || !name || name === currentGroup.name) return

    setPendingGroupId(groupId)
    setMutationError(null)

    try {
      await updateWatchlistGroup(groupId, { name })
      await loadGroups(activeGroupId)
    } catch (error) {
      setMutationError(errorMessage(error))
    } finally {
      setPendingGroupId(null)
    }
  }

  const goAddGroup = () => {
    if (isMutationPending) return
    closeModal()
    navigate('/watchlist/add-group')
  }

  return (
    <div className="pb-2">
      <div className="border-b border-[rgba(217,217,217,0.7)] px-[27px] pt-6 pb-5">
        <span className="text-[20px] font-semibold leading-7 text-gray-900">관심</span>
      </div>

      {isLoading && groups.length === 0 ? (
        <WatchlistSkeleton />
      ) : (
        <>
          <div className="pt-4 pb-6 px-[27px] flex items-center gap-2.5 flex-wrap">
            {groups.map((group) => (
              <button
                key={group.groupId}
                type="button"
                onClick={() => setActiveGroupId(group.groupId)}
                className={`h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal transition-colors ${
                  activeGroupId === group.groupId
                    ? 'bg-[rgba(217,217,217,0.4)] text-gray-900'
                    : 'bg-transparent text-gray-700/60'
                }`}
              >
                {group.name}
              </button>
            ))}
            <button
              type="button"
              onClick={goAddGroup}
              disabled={isMutationPending}
              className="h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal text-gray-700/60 disabled:opacity-50"
            >
              그룹추가
            </button>
            <button
              type="button"
              onClick={() => setModalState('edit')}
              disabled={isMutationPending}
              className="ml-auto text-[12px] leading-5 text-gray-500 disabled:opacity-50"
            >
              그룹 편집
            </button>
          </div>

          {loadError && (
            <div className="px-[33px] pb-5">
              <p className="text-[13px] leading-5 text-error">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadGroups(activeGroupId)}
                className="mt-2 text-[13px] leading-5 text-gray-700 underline"
              >
                다시 시도
              </button>
            </div>
          )}
          {mutationError && <p className="px-[33px] pb-5 text-[13px] leading-5 text-error">{mutationError}</p>}

          {!isLoading && !loadError && groups.length === 0 && (
            <p className="px-[33px] py-6 text-[13px] leading-5 text-gray-500">
              관심그룹이 없어요. 그룹을 추가해 관심종목을 모아보세요.
            </p>
          )}
          {activeGroup && activeGroup.items.length === 0 && (
            <p className="px-[33px] py-6 text-[13px] leading-5 text-gray-500">
              이 그룹에 담긴 관심종목이 없어요.
            </p>
          )}

          <div className="pl-[33px] pr-[16px] flex flex-col gap-7">
            {activeGroup?.items.map((item) => {
              const summary = summaries[item.ticker]
              const hasSummary = Boolean(summary)
              const isPositive = (summary?.changeRate ?? 0) >= 0
              const displayName = resolveStockDisplayName(item.ticker, summary?.stockName)

              return (
                <div
                  key={item.itemId}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/stock/${encodeURIComponent(item.ticker)}`, {
                      state: { stockName: displayName },
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/stock/${encodeURIComponent(item.ticker)}`, {
                        state: { stockName: displayName },
                      })
                    }
                  }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-[15px] font-semibold leading-6 text-gray-900 truncate">
                      {displayName}
                    </span>
                    {isSummariesLoading && !summary ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[12px] leading-5 text-[#2B2B2B] tabular-nums font-light">
                          {summary ? formatPrice(summary.currentPriceKrw) : '시세 정보 없음'}
                        </span>
                        {hasSummary && summary && (
                          <span
                            className={`text-[12px] leading-5 tabular-nums font-light ${
                              isPositive ? 'text-toss-red' : 'text-[#3985FF]'
                            }`}
                          >
                            {formatChangeRate(summary.changeRate)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleRemoveStock(item)
                    }}
                    disabled={isMutationPending}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0 disabled:opacity-50"
                    aria-label="제거"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {modalState !== 'closed' && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60] animate-fade-in" onClick={dismissModal} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-[24px] z-[70] animate-slide-up shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            {modalState === 'edit' ? (
              <div className="px-6 pt-7 pb-7">
                <button
                  type="button"
                  onClick={goAddGroup}
                  disabled={isMutationPending}
                  className="flex items-center gap-3 py-3 w-full text-left disabled:opacity-50"
                >
                  <span className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-500">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="text-[15px] font-medium text-gray-900">새 그룹 추가</span>
                </button>

                {groups.map((group) => (
                  <GroupRow
                    key={group.groupId}
                    group={group}
                    isEditing={editingGroupId === group.groupId}
                    isBusy={isMutationPending}
                    editingValue={editingValue}
                    setEditingValue={setEditingValue}
                    onAskDelete={askDelete}
                    onStartEdit={startEdit}
                    onCommitEdit={() => void commitEdit()}
                    onCancelEdit={cancelEdit}
                    inputRef={editInputRef}
                  />
                ))}

                {mutationError && (
                  <p className="mt-3 text-[13px] leading-5 text-error">{mutationError}</p>
                )}

                <button
                  type="button"
                  onClick={dismissModal}
                  disabled={isMutationPending}
                  className="mt-8 w-full h-[52px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {isMutationPending ? '처리 중' : '확인'}
                </button>
              </div>
            ) : (
              <div className="px-6 pt-7 pb-7 min-h-[360px] flex flex-col">
                <h3 className="text-[17px] font-semibold leading-7 text-gray-900">
                  {deletingGroup?.name} 그룹을 삭제할까요?
                </h3>
                <p className="mt-2 text-[13px] leading-5 text-gray-500">
                  그룹 내 종목도 함께 삭제돼요.
                </p>
                {mutationError && (
                  <p className="mt-4 text-[13px] leading-5 text-error">{mutationError}</p>
                )}

                <div className="mt-auto flex flex-col gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    disabled={isMutationPending}
                    className="w-full h-[52px] bg-black text-white text-[15px] font-medium rounded-full active:bg-gray-800 transition-colors disabled:bg-gray-400"
                  >
                    {pendingGroupId !== null ? '삭제 중' : '삭제하기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalState('edit')}
                    disabled={isMutationPending}
                    className="w-full h-[52px] bg-white text-gray-900 text-[15px] font-medium rounded-full border border-gray-300 active:bg-gray-50 transition-colors disabled:text-gray-400"
                  >
                    나중에
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
