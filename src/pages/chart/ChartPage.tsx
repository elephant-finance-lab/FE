import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  addWatchlistItem,
  createWatchlistGroup,
  getWatchlistGroups,
  removeWatchlistItem,
  type WatchlistGroup,
} from '../../apis/watchlist'
import { useAuth } from '../../contexts/useAuth'
import { trendingStocks, type Stock } from '../../data/mockStocks'

const filterTabs = ['거래량', '급상승', '급하락', '시가총액', '체결강도']

type PickerMode = 'add' | 'remove'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '요청 처리에 실패했습니다.'
}

function hasTicker(group: WatchlistGroup, ticker: string) {
  return group.items.some((item) => item.ticker === ticker)
}

export default function ChartPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [activeTab, setActiveTab] = useState(filterTabs[0])
  const [groups, setGroups] = useState<WatchlistGroup[]>([])
  const [isGroupsLoading, setIsGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pickerStock, setPickerStock] = useState<Stock | null>(null)
  const [pickerMode, setPickerMode] = useState<PickerMode>('add')
  const [pickerError, setPickerError] = useState<string | null>(null)
  const [pendingGroupId, setPendingGroupId] = useState<number | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [showGroupInput, setShowGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setGroups([])
      return
    }

    setIsGroupsLoading(true)
    setGroupsError(null)

    try {
      const result = await getWatchlistGroups()
      setGroups(result.groups)
    } catch (error) {
      setGroupsError(errorMessage(error))
    } finally {
      setIsGroupsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroups()
    }, 0)

    return () => window.clearTimeout(timer)
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
    setPendingGroupId(null)
    setShowGroupInput(false)
    setNewGroupName('')
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

  const handleHeartClick = async (stock: Stock) => {
    const ticker = stock.ticker
    if (!ticker || isAuthLoading) return

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

    setPickerStock(stock)
    setPickerMode(savedGroups.length > 1 ? 'remove' : 'add')
    setPickerError(null)
  }

  const handleGroupChoice = async (group: WatchlistGroup) => {
    const ticker = pickerStock?.ticker
    if (!ticker) return

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
    if (!name || name.length > 50) return

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

  const handleLoadMore = () => {
    // hook for pagination
  }

  const selectedTicker = pickerStock?.ticker
  const tickerGroups = selectedTicker
    ? groups.filter((group) => hasTicker(group, selectedTicker))
    : []
  const selectableGroups = pickerMode === 'add' ? groups : tickerGroups

  return (
    <div className="pb-2">
      <div className="border-b border-[rgba(217,217,217,0.7)] px-[27px] pt-6 pb-5">
        <span className="text-[15px] font-semibold leading-6 text-gray-900">실시간 차트</span>
      </div>

      <div className="pt-4 pb-12 px-[27px]">
        <div className="flex items-center gap-2.5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal transition-colors ${
                activeTab === tab
                  ? 'bg-[rgba(217,217,217,0.4)] text-gray-900'
                  : 'bg-transparent text-gray-700/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {actionError && <p className="mt-4 text-[12px] leading-5 text-error">{actionError}</p>}
      </div>

      <div className="px-[33px] flex flex-col gap-9">
        {trendingStocks.map((stock, idx) => {
          const ticker = stock.ticker
          const isFilled = Boolean(ticker && groups.some((group) => hasTicker(group, ticker)))
          const detailId = ticker ?? stock.id

          return (
            <div
              key={stock.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/stock/${encodeURIComponent(detailId)}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/stock/${encodeURIComponent(detailId)}`)
              }}
              className="flex items-center gap-[22px] cursor-pointer"
            >
              <span className="text-[15px] font-semibold leading-6 text-gray-900 w-3 text-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex items-center gap-[17px] flex-1 min-w-0">
                <div className="w-[33px] h-[33px] rounded-full bg-[#D9D9D9] shrink-0" />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-[15px] font-semibold leading-6 text-gray-900 truncate">
                    {stock.name}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[12px] leading-5 text-[#2B2B2B] tabular-nums font-light">
                      {stock.price}
                    </span>
                    <span
                      className={`text-[12px] leading-5 tabular-nums font-light ${
                        stock.isPositive ? 'text-toss-red' : 'text-[#3985FF]'
                      }`}
                    >
                      {stock.isPositive ? '+' : '-'}
                      {stock.changePercent}
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
                    pendingGroupId !== null ||
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
      </div>

      <div className="mt-6 flex w-full flex-col items-center gap-[12px]">
        <div className="w-full border-t border-[rgba(199,196,196,0.7)]" />
        <button
          type="button"
          onClick={handleLoadMore}
          className="px-3 py-3 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
        >
          더 보기
        </button>
        <div className="w-full border-t border-[rgba(0,0,0,0.07)]" />
      </div>

      {pickerStock && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60] animate-fade-in" onClick={closePicker} />
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
                    disabled={pendingGroupId !== null}
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
                      autoFocus
                      placeholder="그룹명"
                      className="h-[46px] flex-1 rounded-[10px] border border-gray-200 px-3 text-[14px] text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateGroup()}
                      disabled={!newGroupName.trim() || isCreatingGroup}
                      className="h-[46px] rounded-[10px] bg-black px-4 text-[13px] text-white disabled:bg-gray-400"
                    >
                      {isCreatingGroup ? '생성 중' : '생성'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowGroupInput(true)}
                    className="text-[14px] font-medium leading-6 text-gray-700"
                  >
                    + 새 그룹 만들기
                  </button>
                )}
              </div>
            )}

            {pickerError && <p className="mt-4 text-[12px] leading-5 text-error">{pickerError}</p>}

            <button
              type="button"
              onClick={closePicker}
              className="mt-6 w-full h-[52px] bg-white text-gray-900 text-[15px] font-medium rounded-full border border-gray-300 active:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
