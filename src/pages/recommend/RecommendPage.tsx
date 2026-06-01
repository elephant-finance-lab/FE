import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  getActiveAutoTradingSession,
  getRunningAutoTradingSession,
  isActiveAutoTradingStatus,
  stopAutoTradingSession,
  type AutoTradingSession,
} from '../../apis/autoTrading'
import {
  getRecommendations,
  selectRecommendations,
  type RecommendationInfo,
  type RecommendationList,
  type RecommendationSelectionItem,
} from '../../apis/recommendations'
import Button from '../../components/Button'
import {
  clearPendingAutoTradingSelection,
  clearRunningAutoTradingState,
  createAutoTradingIdempotencyKey,
  readRunningAutoTradingState,
  savePendingAutoTradingSelection,
  saveRunningAutoTradingState,
  type AutoTradingTarget,
} from '../../lib/autoTradingStorage'

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function stockName(stock: RecommendationInfo) {
  return stock.stockName || stock.companyName || stock.stockCode || stock.tickerCode || '이름 없는 종목'
}

function stockCode(stock: RecommendationInfo) {
  return stock.stockCode || stock.tickerCode || ''
}

function recommendationKey(stock: RecommendationInfo) {
  const code = stockCode(stock)
  return String(stock.recommendationId ?? (code || stock.modelRecommendationId || stockName(stock)))
}

function toSelectionItem(stock: RecommendationInfo): RecommendationSelectionItem | null {
  const code = stockCode(stock)
  if (stock.recommendationId != null) {
    return code ? { recommendationId: stock.recommendationId, stockCode: code } : { recommendationId: stock.recommendationId }
  }
  return code ? { stockCode: code } : null
}

function isSelectionItem(value: RecommendationSelectionItem | null): value is RecommendationSelectionItem {
  return value !== null
}

function toAutoTradingTarget(stock: RecommendationInfo): AutoTradingTarget {
  return {
    recommendationId: stock.recommendationId,
    stockName: stockName(stock),
    stockCode: stockCode(stock),
    riskLevel: stock.riskLevel,
  }
}

function formatPrice(value: number | null | undefined, currency: string | null | undefined) {
  if (!validNumber(value)) return '가격 정보 없음'
  const suffix = !currency || currency === 'KRW' ? '원' : ` ${currency}`
  return `${value.toLocaleString('ko-KR')}${suffix}`
}

function formatChangeRate(value: number | null | undefined) {
  if (!validNumber(value)) return null
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`
}

function formatScore(value: number | null | undefined) {
  if (!validNumber(value)) return null
  return `AI 점수 ${value.toLocaleString('ko-KR', { maximumFractionDigits: 3 })}`
}

function SkeletonRow() {
  return (
    <div className="flex items-center py-3.5" aria-hidden="true">
      <div className="h-5 w-7 rounded bg-gray-100" />
      <div className="ml-4 flex-1">
        <div className="h-5 w-28 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-40 rounded bg-gray-100" />
      </div>
      <div className="h-9 w-9 rounded bg-gray-100" />
    </div>
  )
}

interface ActiveSessionModalProps {
  error: string | null
  isStopping: boolean
  onContinue: () => void
  onStop: () => void
}

function ActiveSessionModal({
  error,
  isStopping,
  onContinue,
  onStop,
}: ActiveSessionModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-black/35 px-5 pt-5 pb-[calc(112px+env(safe-area-inset-bottom))]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-auto-trading-title"
        className="max-h-[calc(100dvh-137px-env(safe-area-inset-bottom))] w-full max-w-[420px] overflow-y-auto rounded-[20px] bg-white p-6 shadow-xl"
      >
        <p className="text-[13px] font-medium leading-5 text-toss-blue">실행 중</p>
        <h2 id="active-auto-trading-title" className="mt-2 text-[20px] font-semibold leading-7 text-gray-900">
          AI 자동매매가 실행 중입니다
        </h2>
        <p className="mt-3 text-[14px] leading-6 text-gray-600">
          새 추천 종목을 선택하려면 현재 실행 중인 자동매매를 중단해야 합니다. 자동매매를
          중단하고 다시 선택하시겠습니까?
        </p>
        {error && <p className="mt-3 text-[13px] leading-5 text-error">{error}</p>}
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={onContinue} variant="secondary" disabled={isStopping}>
            계속 실행하기
          </Button>
          <Button onClick={onStop} disabled={isStopping}>
            {isStopping ? '중단 요청 중...' : '중단하고 다시 선택하기'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function RecommendPage() {
  const navigate = useNavigate()
  const [recommendationList, setRecommendationList] = useState<RecommendationList | null>(null)
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeSession, setActiveSession] = useState<AutoTradingSession | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)

  const recommendations = useMemo(
    () => recommendationList?.recommendations ?? [],
    [recommendationList],
  )
  const selectedStockInfo = useMemo(
    () => recommendations.filter((stock) => selectedStocks.has(recommendationKey(stock))),
    [recommendations, selectedStocks],
  )
  const selectedRecommendations = useMemo(
    () =>
      selectedStockInfo
        .map(toSelectionItem)
        .filter(isSelectionItem),
    [selectedStockInfo],
  )
  const hasSelectedStocks = selectedRecommendations.length > 0

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSaveError(null)
    try {
      const result = await getRecommendations()
      setRecommendationList(result)
      setSelectedStocks(
        new Set(
          (result.recommendations ?? [])
            .filter((stock) => stock.isSelected)
            .map(recommendationKey),
        ),
      )
    } catch (loadError) {
      setRecommendationList(null)
      setSelectedStocks(new Set())
      setError(errorMessage(loadError, '추천 종목을 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsCheckingSession(true)
      setSessionError(null)
      void getRunningAutoTradingSession()
        .then((session) => {
          if (session) {
            setActiveSession(session)
            setIsLoading(false)
            return
          }
          setActiveSession(null)
          return loadRecommendations()
        })
        .catch((loadError) => {
          setIsLoading(false)
          setSessionError(errorMessage(loadError, '자동매매 실행 상태를 확인하지 못했습니다.'))
        })
        .finally(() => setIsCheckingSession(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadRecommendations])

  const toggleStock = (stock: RecommendationInfo) => {
    setSaveError(null)
    setSelectedStocks((prev) => {
      const key = recommendationKey(stock)
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleConfirmSelection = async () => {
    if (!hasSelectedStocks || isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const session = await getRunningAutoTradingSession()
      if (session) {
        setActiveSession(session)
        setStopError(null)
        return
      }
      const payload =
        selectedRecommendations.length === 1
          ? selectedRecommendations[0]
          : { selectedRecommendations }
      const result = await selectRecommendations(payload)
      const selection = {
        recommendationIds: result.recommendationIds,
        stockCodes: result.stockCodes,
        targets: selectedStockInfo.map(toAutoTradingTarget),
        idempotencyKey: createAutoTradingIdempotencyKey(),
      }
      clearRunningAutoTradingState()
      savePendingAutoTradingSelection(selection)
      navigate('/trade/confirm', { state: { selection } })
    } catch (selectError) {
      setSaveError(errorMessage(selectError, '선택한 추천 종목을 저장하지 못했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleContinueSession = () => {
    if (!activeSession) return
    const storedSession = readRunningAutoTradingState()
    saveRunningAutoTradingState({
      session: activeSession,
      selection:
        storedSession?.session.sessionId === activeSession.sessionId
          ? storedSession.selection
          : null,
    })
    navigate('/trade/complete', { state: { session: activeSession, started: false } })
  }

  const handleStopSession = async () => {
    if (!activeSession || isStopping) return
    setIsStopping(true)
    setStopError(null)
    try {
      await stopAutoTradingSession(activeSession.sessionId)
      const activeSessionAfterStop = await getActiveAutoTradingSession()
      if (isActiveAutoTradingStatus(activeSessionAfterStop?.status)) {
        setActiveSession(activeSessionAfterStop)
        setStopError('자동매매 중단 요청을 처리 중입니다. 중단된 뒤 다시 선택해주세요.')
        return
      }
      clearPendingAutoTradingSelection()
      clearRunningAutoTradingState()
      setActiveSession(null)
      await loadRecommendations()
    } catch (stopRequestError) {
      setStopError(errorMessage(stopRequestError, 'AI 자동매매 중단에 실패했습니다. 잠시 후 다시 시도해주세요.'))
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 pb-6">
        <h1 className="section-title">종목 추천</h1>
        <p className="body-copy mt-3">AI가 분석한 맞춤 추천 종목입니다</p>
        <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-[10px] bg-toss-blue-light px-3 py-2">
          <span className="shrink-0 text-[13px] leading-5 font-medium text-toss-blue">맞춤형 투자자</span>
          <span className="min-w-0 truncate text-[12px] leading-5 text-gray-500">
            {recommendationList?.userProfileSummary || '추천 모델 분석 결과'}
          </span>
        </div>
      </div>

      <div className="px-6">
        {(isCheckingSession || isLoading) && (
          <div aria-label="추천 종목 로딩 중">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        )}

        {!isCheckingSession && sessionError && (
          <div className="rounded-[15px] bg-gray-50 px-5 py-6">
            <p className="text-[15px] leading-6 text-gray-900">자동매매 상태를 확인하지 못했습니다</p>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">{sessionError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 text-[13px] font-medium leading-5 text-toss-blue"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isCheckingSession && !sessionError && !activeSession && !isLoading && error && (
          <div className="rounded-[15px] bg-gray-50 px-5 py-6">
            <p className="text-[15px] leading-6 text-gray-900">추천 종목을 불러오지 못했습니다</p>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => void loadRecommendations()}
              className="mt-4 text-[13px] font-medium leading-5 text-toss-blue"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isCheckingSession && !sessionError && !activeSession && !isLoading && !error && recommendations.length === 0 && (
          <div className="rounded-[15px] bg-gray-50 px-5 py-8 text-center">
            <p className="text-[15px] leading-6 text-gray-900">추천 종목이 없습니다</p>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">
              AI 모델 추천 결과가 준비되면 이곳에 표시됩니다
            </p>
          </div>
        )}

        {!isCheckingSession &&
          !sessionError &&
          !activeSession &&
          !isLoading &&
          !error &&
          recommendations.map((stock, idx) => {
            const key = recommendationKey(stock)
            const isSelected = selectedStocks.has(key)
            const detailId = stock.recommendationId
            const changeRate = formatChangeRate(stock.changeRate)
            const score = formatScore(stock.score)
            const changeColor =
              validNumber(stock.changeRate) && stock.changeRate < 0 ? 'text-[#3985FF]' : 'text-toss-red'

            return (
              <div
                key={key}
                role="button"
                tabIndex={detailId == null ? -1 : 0}
                onClick={() => {
                  if (detailId != null) {
                    navigate(`/recommend/${detailId}`, { state: { stockCode: stockCode(stock) } })
                  }
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || detailId == null) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/recommend/${detailId}`, { state: { stockCode: stockCode(stock) } })
                  }
                }}
                className="flex cursor-pointer items-center rounded-xl py-3.5 transition-colors active:bg-gray-50"
              >
                <span className="w-7 shrink-0 text-center text-[15px] leading-6 font-normal text-gray-900">
                  {stock.rank ?? idx + 1}
                </span>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="truncate text-[15px] leading-6 font-medium text-gray-900">{stockName(stock)}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="text-[13px] leading-5 font-normal text-gray-500 tabular-nums">
                      {formatPrice(stock.currentPrice, stock.currency)}
                    </span>
                    {changeRate ? (
                      <span className={`text-[12px] leading-4 font-medium tabular-nums ${changeColor}`}>
                        {changeRate}
                      </span>
                    ) : (
                      score && <span className="text-[12px] leading-4 font-medium text-gray-500">{score}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleStock(stock)
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${
                    isSelected ? 'text-toss-blue' : 'text-[#D9D9D9]'
                  }`}
                  aria-label={isSelected ? '선택 해제' : '선택'}
                  aria-pressed={isSelected}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2.4" />
                    <path
                      d="M8 12.2l2.8 2.8L16.5 9"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </button>
              </div>
            )
          })}
      </div>

      <div className="px-6 mt-8">
        {saveError && <p className="mb-3 text-[13px] leading-5 text-error">{saveError}</p>}
        <Button
          onClick={() => void handleConfirmSelection()}
          disabled={!hasSelectedStocks || isSaving || isCheckingSession || Boolean(activeSession)}
          variant={hasSelectedStocks ? 'primary' : 'secondary'}
          className="disabled:opacity-100"
        >
          {isSaving ? '저장 중...' : '선택 종목 확인하기'}
        </Button>
      </div>
      {activeSession && (
        <ActiveSessionModal
          error={stopError}
          isStopping={isStopping}
          onContinue={handleContinueSession}
          onStop={() => void handleStopSession()}
        />
      )}
    </div>
  )
}
