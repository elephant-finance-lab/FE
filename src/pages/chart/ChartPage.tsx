import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getStockRanking, type RankingItem, type RankingType } from '../../apis/chart'
import {
  addWatchlistItem,
  createWatchlistGroup,
  getWatchlistGroups,
  removeWatchlistItem,
  type WatchlistGroup,
} from '../../apis/watchlist'
import { useAuth } from '../../contexts/useAuth'

const rankingTabs: { label: string; type: RankingType }[] = [
  { label: '거래량', type: 'volume' },
  { label: '급상승', type: 'up' },
  { label: '급하락', type: 'down' },
  { label: '시가총액', type: 'market-cap' },
  { label: '체결강도', type: 'contract-strength' },
]
const RANKING_BATCH_SIZE = 10
const AUTO_LOAD_LIMIT = 30
const APPEND_INDICATOR_DELAY_MS = 120

type PickerMode = 'add' | 'remove'

interface PickerStock {
  ticker: string
  name: string
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리에 실패했습니다.'
}

function hasTicker(group: WatchlistGroup, ticker: string) {
  return group.items.some((item) => item.ticker === ticker)
}

function formatPrice(price: number) {
  const value = Number(price)
  if (!Number.isFinite(value)) return '-'
  return `${value.toLocaleString('ko-KR')}원`
}

function formatChangeRate(rate: number) {
  const value = Number(rate)
  if (!Number.isFinite(value)) return '-'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`
}

function movementColor(rate: number) {
  if (rate > 0) return 'text-toss-red'
  if (rate < 0) return 'text-[#3985FF]'
  return 'text-gray-500'
}

function RankingSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-7" aria-hidden="true">
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className="flex items-center gap-[17px] animate-pulse">
          <div className="h-5 w-6 shrink-0 rounded bg-gray-100" />
          <div className="flex-1 min-w-0">
            <div className="h-5 w-28 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-36 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-5 shrink-0 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function ChartPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [activeRankingType, setActiveRankingType] = useState<RankingType>(rankingTabs[0].type)
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([])
  const [visibleCount, setVisibleCount] = useState(RANKING_BATCH_SIZE)
  const [isRankingLoading, setIsRankingLoading] = useState(true)
  const [isAppending, setIsAppending] = useState(false)
  const [rankingError, setRankingError] = useState(false)
  const [groups, setGroups] = useState<WatchlistGroup[]>([])
  const [isGroupsLoading, setIsGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pickerStock, setPickerStock] = useState<PickerStock | null>(null)
  const [pickerMode, setPickerMode] = useState<PickerMode>('add')
  const [pickerError, setPickerError] = useState<string | null>(null)
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [showGroupInput, setShowGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const rankingRequestIdRef = useRef(0)
  const appendTimerRef = useRef<number | null>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)
  const groupsRequestIdRef = useRef(0)
  const isPickerBusy = pendingGroupId !== null || isCreatingGroup

  const loadRanking = useCallback(async (type: RankingType) => {
    const requestId = ++rankingRequestIdRef.current
    if (appendTimerRef.current !== null) {
      window.clearTimeout(appendTimerRef.current)
      appendTimerRef.current = null
    }
    setVisibleCount(RANKING_BATCH_SIZE)
    setIsRankingLoading(true)
    setIsAppending(false)
    setRankingError(false)
    setRankingItems([])

    try {
      const response = await getStockRanking(type)
      if (requestId !== rankingRequestIdRef.current) return
      setRankingItems(response.items)
    } catch {
      if (requestId !== rankingRequestIdRef.current) return
      setRankingError(true)
    } finally {
      if (requestId === rankingRequestIdRef.current) {
        setIsRankingLoading(false)
      }
    }
  }, [])

  const selectRankingType = (type: RankingType) => {
    if (type === activeRankingType) return
    rankingRequestIdRef.current += 1
    if (appendTimerRef.current !== null) {
      window.clearTimeout(appendTimerRef.current)
      appendTimerRef.current = null
    }
    setActiveRankingType(type)
    setRankingItems([])
    setVisibleCount(RANKING_BATCH_SIZE)
    setIsRankingLoading(true)
    setIsAppending(false)
    setRankingError(false)
  }

  const loadGroups = useCallback(async () => {
    const requestId = ++groupsRequestIdRef.current

    if (!isAuthenticated) {
      setGroups([])
      setIsGroupsLoading(false)
      setGroupsError(null)
      return
    }

    setIsGroupsLoading(true)
    setGroupsError(null)

    try {
      const result = await getWatchlistGroups()
      if (requestId !== groupsRequestIdRef.current) return
      setGroups(result.groups)
    } catch (error) {
      if (requestId !== groupsRequestIdRef.current) return
      setGroupsError(errorMessage(error))
    } finally {
      if (requestId === groupsRequestIdRef.current) {
        setIsGroupsLoading(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRanking(activeRankingType)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      rankingRequestIdRef.current += 1
      if (appendTimerRef.current !== null) {
        window.clearTimeout(appendTimerRef.current)
        appendTimerRef.current = null
      }
    }
  }, [activeRankingType, loadRanking])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroups()
    }, 0)

    return () => {
      window.clearTimeout(timer)
      groupsRequestIdRef.current += 1
    }
  }, [loadGroups])

  useEffect(() => {
    if (!pickerStock) return
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [pickerStock])

  const closePicker = () => {
    setPickerStock(null)
    setPickerError(null)
    setShowGroupInput(false)
    setNewGroupName('')
  }

  const dismissPicker = () => {
    if (isPickerBusy) return
    closePicker()
  }

  const removeImmediately = async (group: WatchlistGroup, ticker: string) => {
    setPendingGroupId(group.groupId)
    setActionError(null)

    try {
      await removeWatchlistItem({ groupId: group.groupId, ticker })
      await loadGroups()
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setPendingGroupId(null)
    }
  }

  const handleHeartClick = async (stock: RankingItem) => {
    const ticker = stock.tickerCode
    if (!ticker || isAuthLoading || isPickerBusy) return

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    setActionError(null)
    const savedGroups = groups.filter((group) => hasTicker(group, ticker))

    if (savedGroups.length === 1) {
      await removeImmediately(savedGroups[0], ticker)
      return
    }

    setPickerStock({ ticker, name: stock.stockName ?? ticker })
    setPickerMode(savedGroups.length > 1 ? 'remove' : 'add')
    setPickerError(null)
  }

  const handleGroupChoice = async (group: WatchlistGroup) => {
    const ticker = pickerStock?.ticker
    if (!ticker || isPickerBusy) return

    setPendingGroupId(group.groupId)
    setPickerError(null)

    try {
      if (pickerMode === 'add') {
        await addWatchlistItem({ groupId: group.groupId, ticker })
      } else {
        await removeWatchlistItem({ groupId: group.groupId, ticker })
      }
      await loadGroups()
      closePicker()
    } catch (error) {
      setPickerError(errorMessage(error))
    } finally {
      setPendingGroupId(null)
    }
  }

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name || name.length > 50 || isPickerBusy) return

    setIsCreatingGroup(true)
    setPickerError(null)

    try {
      await createWatchlistGroup({ name })
      await loadGroups()
      setShowGroupInput(false)
      setNewGroupName('')
    } catch (error) {
      setPickerError(errorMessage(error))
    } finally {
      setIsCreatingGroup(false)
    }
  }

  const selectedTicker = pickerStock?.ticker
  const tickerGroups = selectedTicker
    ? groups.filter((group) => hasTicker(group, selectedTicker))
    : []
  const selectableGroups = pickerMode === 'add' ? groups : tickerGroups
  const visibleRankingItems = rankingItems.slice(0, visibleCount)
  const hasMoreRankingItems = visibleCount < rankingItems.length
  const canAutoLoadMore = hasMoreRankingItems && visibleCount < AUTO_LOAD_LIMIT
  const shouldShowMoreButton = hasMoreRankingItems && visibleCount >= AUTO_LOAD_LIMIT

  // The ranking API returns the full item array; paging here only expands visible rows.
  const appendNextBatch = useCallback(() => {
    if (isRankingLoading || rankingError || isAppending || !hasMoreRankingItems) return

    setIsAppending(true)
    appendTimerRef.current = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + RANKING_BATCH_SIZE, rankingItems.length))
      setIsAppending(false)
      appendTimerRef.current = null
    }, APPEND_INDICATOR_DELAY_MS)
  }, [hasMoreRankingItems, isAppending, isRankingLoading, rankingError, rankingItems.length])

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || !canAutoLoadMore || isAppending) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          appendNextBatch()
        }
      },
      { rootMargin: '0px 0px 140px 0px' },
    )
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [appendNextBatch, canAutoLoadMore, isAppending])

  return (
    <div className="pb-2">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="px-[27px] pt-6 pb-5">
          <span className="text-[15px] font-semibold leading-6 text-gray-900">실시간 차트</span>
        </div>

        <div className="px-[27px] pt-4 pb-8">
          <div className="flex items-center gap-2.5 flex-wrap">
            {rankingTabs.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => selectRankingType(tab.type)}
                className={`h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal transition-colors ${
                  activeRankingType === tab.type
                    ? 'bg-[rgba(217,217,217,0.4)] text-gray-900'
                    : 'bg-transparent text-gray-700/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionError && (
        <p className="px-[27px] pt-4 text-[12px] leading-5 text-error">{actionError}</p>
      )}

      {isRankingLoading && (
        <div className="px-[27px] pt-6" aria-label="종목 랭킹 로딩 중">
          <RankingSkeleton count={RANKING_BATCH_SIZE} />
        </div>
      )}

      {!isRankingLoading && rankingError && (
        <div className="px-[27px] pt-6 pb-6">
          <p className="text-[13px] leading-5 text-gray-500">데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadRanking(activeRankingType)}
            className="mt-2 text-[13px] leading-5 text-gray-700 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isRankingLoading && !rankingError && rankingItems.length === 0 && (
        <p className="px-[27px] pt-6 pb-6 text-[13px] leading-5 text-gray-500">
          표시할 종목이 없습니다.
        </p>
      )}

      {!isRankingLoading && !rankingError && (
        <div className="px-[27px] pt-6 flex flex-col gap-7">
          {visibleRankingItems.map((stock) => {
            const ticker = stock.tickerCode
            const isFilled = Boolean(ticker && groups.some((group) => hasTicker(group, ticker)))

            return (
              <div
                key={ticker ?? `${stock.rank}-${stock.stockName ?? 'stock'}`}
                role={ticker ? 'button' : undefined}
                tabIndex={ticker ? 0 : undefined}
                onClick={() => {
                  if (ticker) {
                    navigate(`/stock/${encodeURIComponent(ticker)}`, {
                      state: { stockName: stock.stockName ?? ticker },
                    })
                  }
                }}
                onKeyDown={(e) => {
                  if (!ticker) return
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter') {
                    navigate(`/stock/${encodeURIComponent(ticker)}`, {
                      state: { stockName: stock.stockName ?? ticker },
                    })
                  }
                }}
                className={`flex items-center gap-[17px] ${ticker ? 'cursor-pointer' : ''}`}
              >
                <span className="text-[15px] font-semibold leading-6 text-gray-900 w-6 text-center shrink-0">
                  {stock.rank}
                </span>
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-[15px] font-semibold leading-6 text-gray-900 truncate">
                      {stock.stockName ?? ticker ?? '종목명 없음'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[12px] leading-5 text-[#2B2B2B] tabular-nums font-light">
                        {formatPrice(stock.price)}
                      </span>
                      <span
                        className={`text-[12px] leading-5 tabular-nums font-light ${movementColor(stock.changeRate)}`}
                      >
                        {formatChangeRate(stock.changeRate)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleHeartClick(stock)
                    }}
                    disabled={
                      !ticker ||
                      isPickerBusy ||
                      isAuthLoading ||
                      (isAuthenticated && isGroupsLoading)
                    }
                    className="w-6 h-6 flex items-center justify-center shrink-0 disabled:opacity-50"
                    aria-label={isFilled ? '관심종목 제거' : '관심종목 추가'}
                    aria-pressed={isFilled}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={isFilled ? '#FF3B30' : '#D9D9D9'}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
          {isAppending && <RankingSkeleton count={4} />}
          {canAutoLoadMore && !isAppending && (
            <div ref={loadMoreSentinelRef} className="h-px w-full" aria-hidden="true" />
          )}
          {shouldShowMoreButton && (
            <button
              type="button"
              onClick={appendNextBatch}
              disabled={isAppending}
              className="mb-2 mt-1 h-[48px] w-full rounded-[12px] border border-gray-200 text-[14px] font-medium leading-6 text-gray-700 transition-colors active:bg-gray-50 disabled:text-gray-400"
            >
              {isAppending ? '불러오는 중' : '더보기'}
            </button>
          )}
        </div>
      )}

      {pickerStock && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60] animate-fade-in" onClick={dismissPicker} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-[24px] z-[70] animate-slide-up shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-6 pt-7 pb-7">
            <h3 className="text-[17px] font-semibold leading-7 text-gray-900">
              {pickerMode === 'add' ? `${pickerStock.name}을 담을 그룹` : '제거할 그룹을 선택해주세요'}
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-gray-500">
              {pickerMode === 'add'
                ? '관심그룹을 선택하면 바로 추가돼요.'
                : '이 종목은 여러 관심그룹에 저장되어 있어요.'}
            </p>

            <div className="mt-5 flex flex-col gap-2 max-h-[224px] overflow-y-auto">
              {isGroupsLoading && (
                <p className="py-4 text-[13px] leading-5 text-gray-500">관심그룹을 불러오고 있어요.</p>
              )}
              {!isGroupsLoading && groupsError && (
                <div className="py-2">
                  <p className="text-[13px] leading-5 text-error">{groupsError}</p>
                  <button
                    type="button"
                    onClick={() => void loadGroups()}
                    disabled={isPickerBusy}
                    className="mt-2 text-[13px] leading-5 text-gray-700 underline"
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {!isGroupsLoading &&
                !groupsError &&
                selectableGroups.map((group) => (
                  <button
                    key={group.groupId}
                    type="button"
                    disabled={isPickerBusy}
                    onClick={() => void handleGroupChoice(group)}
                    className="flex h-[52px] w-full items-center justify-between rounded-[12px] bg-gray-50 px-4 text-left disabled:opacity-50"
                  >
                    <span className="text-[15px] font-medium text-gray-900">{group.name}</span>
                    <span className="text-[12px] text-gray-500">{group.items.length}개</span>
                  </button>
                ))}
              {!isGroupsLoading &&
                !groupsError &&
                selectableGroups.length === 0 &&
                pickerMode === 'add' && (
                  <p className="py-2 text-[13px] leading-5 text-gray-500">
                    아직 관심그룹이 없어요. 새 그룹을 만들어주세요.
                  </p>
                )}
            </div>

            {pickerMode === 'add' && (
              <div className="mt-4">
                {showGroupInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      maxLength={50}
                      disabled={isPickerBusy}
                      autoFocus
                      placeholder="그룹명"
                      className="h-[46px] flex-1 rounded-[10px] border border-gray-200 px-3 text-[14px] text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateGroup()}
                      disabled={!newGroupName.trim() || isPickerBusy}
                      className="h-[46px] rounded-[10px] bg-black px-4 text-[13px] text-white disabled:bg-gray-400"
                    >
                      {isCreatingGroup ? '생성 중' : '생성'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowGroupInput(true)}
                    disabled={isPickerBusy}
                    className="text-[14px] font-medium leading-6 text-gray-700 disabled:opacity-50"
                  >
                    + 새 그룹 만들기
                  </button>
                )}
              </div>
            )}

            {pickerError && <p className="mt-4 text-[12px] leading-5 text-error">{pickerError}</p>}

            <button
              type="button"
              onClick={dismissPicker}
              disabled={isPickerBusy}
              className="mt-6 w-full h-[52px] bg-white text-gray-900 text-[15px] font-medium rounded-full border border-gray-300 active:bg-gray-50 transition-colors disabled:text-gray-400"
            >
              {isPickerBusy ? '처리 중' : '닫기'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
