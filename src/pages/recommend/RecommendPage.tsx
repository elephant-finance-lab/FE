import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  getAutoTradingReadiness,
  getActiveAutoTradingSessionWithStatus,
  isActiveAutoTradingStatus,
  stopAutoTradingSession,
  type AutoTradingReadiness,
  type AutoTradingSession,
} from '../../apis/autoTrading'
import {
  getRecommendations,
  type RecommendationInfo,
  type RecommendationList,
} from '../../apis/recommendations'
import { getStockSummary, type StockSummary } from '../../apis/stocks'
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
import {
  autoTradingReadinessMessage,
  isPaperAutoTradingReady,
} from '../../lib/autoTradingReadiness'
import {
  formatCacheAgeSec,
  recommendationStaleNotice,
  recommendationStaleSummary,
  recommendationUnavailableMessage,
} from '../../lib/recommendationStatus'

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function firstValidNumber(...values: Array<number | null | undefined>) {
  return values.find(validNumber) ?? null
}

const PRICE_SUMMARY_CONCURRENCY = 2
const PRICE_SUMMARY_RETRY_COUNT = 2
const PRICE_SUMMARY_RETRY_DELAY_MS = 450
const STOP_STATUS_POLL_ATTEMPTS = 12
const STOP_STATUS_POLL_INTERVAL_MS = 750
type IsCurrent = () => boolean

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function getStockSummaryWithRetry(code: string, isCurrent: IsCurrent = () => true) {
  let lastError: unknown = null
  for (let attempt = 0; attempt <= PRICE_SUMMARY_RETRY_COUNT; attempt += 1) {
    if (!isCurrent()) return null
    try {
      return await getStockSummary(code)
    } catch (error) {
      lastError = error
      if (attempt < PRICE_SUMMARY_RETRY_COUNT) {
        await delay(PRICE_SUMMARY_RETRY_DELAY_MS * (attempt + 1))
        if (!isCurrent()) return null
      }
    }
  }
  throw lastError
}

async function getPriceSummaries(codes: string[], isCurrent: IsCurrent = () => true) {
  const results: Array<readonly [string, StockSummary | null]> = []
  let cursor = 0

  async function worker() {
    while (isCurrent() && cursor < codes.length) {
      const code = codes[cursor]
      cursor += 1
      try {
        const summary = await getStockSummaryWithRetry(code, isCurrent)
        if (!isCurrent()) return
        results.push([code, summary] as const)
      } catch {
        if (!isCurrent()) return
        results.push([code, null] as const)
      }
      if (!isCurrent()) return
      await delay(PRICE_SUMMARY_RETRY_DELAY_MS)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(PRICE_SUMMARY_CONCURRENCY, codes.length) }, () => worker()),
  )
  return Object.fromEntries(results)
}

async function waitForStoppedAutoTradingSession() {
  let latestSession: AutoTradingSession | null = null

  for (let attempt = 0; attempt < STOP_STATUS_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await delay(STOP_STATUS_POLL_INTERVAL_MS)

    latestSession = await getActiveAutoTradingSessionWithStatus()
    if (!latestSession || !isActiveAutoTradingStatus(latestSession.status)) {
      return null
    }
  }

  return latestSession
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

function RecommendationLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative min-h-[360px] overflow-hidden rounded-[18px] bg-[#F8FBFF] px-5 pt-8 pb-7 text-center"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-toss-blue-light to-transparent" />
      <div className="relative mx-auto h-[178px] w-full max-w-[260px]" aria-hidden="true">
        <svg viewBox="0 0 260 178" className="h-full w-full" fill="none">
          <path d="M24 136H236" stroke="#DDEAFF" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 120H228" stroke="#EAF2FF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />
          <path d="M32 90H228" stroke="#EAF2FF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />
          <path d="M32 60H228" stroke="#EAF2FF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 8" />

          <path
            d="M34 129C48 121 60 126 72 111C84 96 96 107 109 96C124 83 137 91 151 75C164 60 177 70 193 54C204 43 215 48 227 40"
            className="recommendation-loading-chart"
            stroke="#34C759"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="recommendation-loading-scan">
            <rect x="48" y="34" width="36" height="106" rx="18" fill="#3182F6" opacity="0.08" />
            <path d="M66 38V137" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" opacity="0.24" />
          </g>

          <g className="recommendation-loading-spark" style={{ animationDelay: '0ms' }}>
            <circle cx="204" cy="46" r="11" fill="#FFD66B" />
            <path d="M204 39V53M198 46H210" stroke="#9B7414" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="recommendation-loading-spark" style={{ animationDelay: '260ms' }}>
            <circle cx="54" cy="124" r="8" fill="#DDF8E7" />
            <path d="M50 124L53 127L59 120" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g className="recommendation-loading-spark" style={{ animationDelay: '520ms' }}>
            <circle cx="184" cy="73" r="7" fill="#E8F3FF" />
            <path d="M181 73L184 76L189 69" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          <g className="recommendation-loading-elephant">
            <ellipse cx="126" cy="116" rx="46" ry="30" fill="#3182F6" />
            <circle cx="83" cy="104" r="27" fill="#3182F6" />
            <ellipse cx="64" cy="104" rx="17" ry="21" fill="#8BBFFF" />
            <ellipse cx="101" cy="104" rx="15" ry="19" fill="#7AB5FF" />
            <circle cx="75" cy="98" r="3.2" fill="white" />
            <circle cx="76" cy="99" r="1.5" fill="#191F28" />
            <path
              d="M76 112C76 129 56 131 56 118C56 113 61 112 64 116"
              stroke="#2272EB"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path d="M100 141V124M132 142V126M156 139V124" stroke="#2272EB" strokeWidth="11" strokeLinecap="round" />
            <path d="M158 97C170 100 177 107 181 118" stroke="#2272EB" strokeWidth="8" strokeLinecap="round" />
            <circle cx="57" cy="118" r="12" fill="white" stroke="#191F28" strokeWidth="3" />
            <path d="M66 127L76 137" stroke="#191F28" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      <p className="mt-2 text-[13px] font-medium leading-5 text-toss-blue">AI 추천 생성 중</p>
      <h2 className="mt-2 text-[20px] font-semibold leading-7 text-gray-900">
        코끼리 연구원이 종목을 살펴보고 있어요
      </h2>
      <p className="mx-auto mt-3 max-w-[260px] text-[14px] leading-6 text-gray-500">
        모델 분석 결과가 도착하는 대로 맞춤 추천 목록을 보여드릴게요.
      </p>

      <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="recommendation-loading-dot h-2 w-2 rounded-full bg-toss-blue"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </div>
      <div className="mx-auto mt-5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(49,130,246,0.08)]" aria-hidden="true">
        <div className="recommendation-loading-progress h-full w-1/3 rounded-full bg-toss-blue" />
      </div>
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
          새 추천 종목으로 다시 시작하려면 현재 실행 중인 자동매매를 중단해야 합니다. 자동매매를
          중단하고 다시 확인하시겠습니까?
        </p>
        {error && <p className="mt-3 text-[13px] leading-5 text-error">{error}</p>}
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={onContinue} variant="secondary" disabled={isStopping}>
            계속 실행하기
          </Button>
          <Button onClick={onStop} disabled={isStopping}>
            {isStopping ? '중단 요청 중...' : '중단하고 다시 확인하기'}
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
  const [priceSummaries, setPriceSummaries] = useState<Record<string, StockSummary | null>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeSession, setActiveSession] = useState<AutoTradingSession | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<AutoTradingReadiness | null>(null)
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(true)
  const [readinessError, setReadinessError] = useState<string | null>(null)

  const recommendations = useMemo(
    () => recommendationList?.recommendations ?? [],
    [recommendationList],
  )
  const autoTradingStockInfo = useMemo(
    () =>
      recommendations.filter(
        (stock): stock is RecommendationInfo & { recommendationId: number } =>
          stock.recommendationId != null,
      ),
    [recommendations],
  )
  const hasAutoTradingTargets = autoTradingStockInfo.length > 0
  const cacheAgeText = formatCacheAgeSec(recommendationList?.cacheAgeSec)
  const selectedBundleId = useMemo(
    () =>
      autoTradingStockInfo.map((stock) => stock.bundleId).find(Boolean) ??
      recommendationList?.bundleId ??
      null,
    [autoTradingStockInfo, recommendationList?.bundleId],
  )
  const isRecommendationStale = recommendationList?.stale === true
  const staleNotice = recommendationStaleNotice({
    stale: isRecommendationStale,
    staleReason: recommendationList?.staleReason,
    cacheAgeText,
  })
  const staleSummary = recommendationStaleSummary(recommendationList?.staleReason, cacheAgeText)
  const canStartAutoTrading = isPaperAutoTradingReady(readiness) && !isRecommendationStale
  const readinessNotice =
    staleNotice ||
    readinessError ||
    (canStartAutoTrading ? null : autoTradingReadinessMessage(readiness))

  const loadReadiness = useCallback(async (
    isCurrent: () => boolean = () => true,
    bundleId: string | null = null,
  ) => {
    if (!isCurrent()) return
    setIsCheckingReadiness(true)
    setReadinessError(null)
    try {
      const result = await getAutoTradingReadiness(bundleId)
      if (!isCurrent()) return
      setReadiness(result)
    } catch (loadError) {
      if (!isCurrent()) return
      setReadiness(null)
      setReadinessError(errorMessage(loadError, 'AI 자동매매 준비 상태를 확인하지 못했습니다.'))
    } finally {
      if (isCurrent()) setIsCheckingReadiness(false)
    }
  }, [])

  const loadRecommendations = useCallback(async (isCurrent: () => boolean = () => true) => {
    if (!isCurrent()) return
    setIsLoading(true)
    setError(null)
    setSaveError(null)
    try {
      const result = await getRecommendations()
      if (!isCurrent()) return
      setRecommendationList(result)
      setPriceSummaries({})
    } catch (loadError) {
      if (!isCurrent()) return
      setRecommendationList(null)
      setPriceSummaries({})
      setError(recommendationUnavailableMessage(loadError, '추천 종목을 불러오지 못했습니다.'))
    } finally {
      if (isCurrent()) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      if (!current) return
      setIsCheckingSession(true)
      setSessionError(null)
      void getActiveAutoTradingSessionWithStatus()
        .then((session) => {
          if (!current) return
          if (session) {
            setActiveSession(session)
            setIsLoading(false)
            setIsCheckingReadiness(false)
            return
          }
          setActiveSession(null)
          void loadReadiness(() => current)
          return loadRecommendations(() => current)
        })
        .catch((loadError) => {
          if (!current) return
          setIsLoading(false)
          setIsCheckingReadiness(false)
          setSessionError(errorMessage(loadError, '자동매매 실행 상태를 확인하지 못했습니다.'))
        })
        .finally(() => {
          if (current) setIsCheckingSession(false)
        })
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [loadRecommendations, loadReadiness])

  useEffect(() => {
    if (activeSession || !recommendationList) return
    let current = true
    const timer = window.setTimeout(() => {
      void loadReadiness(() => current, selectedBundleId)
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [activeSession, loadReadiness, recommendationList, selectedBundleId])

  useEffect(() => {
    const codes = Array.from(new Set(recommendations.map((stock) => stockCode(stock).trim()).filter(Boolean)))
    let isCurrent = true

    const timer = window.setTimeout(() => {
      setPriceSummaries({})
      if (codes.length === 0) return

      void getPriceSummaries(codes, () => isCurrent).then((results) => {
        if (isCurrent) setPriceSummaries(results)
      })
    }, 0)

    return () => {
      isCurrent = false
      window.clearTimeout(timer)
    }
  }, [recommendations])

  const handleConfirmSelection = async () => {
    if (!hasAutoTradingTargets || isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const session = await getActiveAutoTradingSessionWithStatus()
      if (session) {
        setActiveSession(session)
        setStopError(null)
        return
      }
      if (isRecommendationStale) {
        setSaveError(staleNotice ?? '추천 데이터가 최신이 아닙니다. 새 추천 갱신 후 다시 시도해주세요.')
        return
      }
      const latestReadiness = await getAutoTradingReadiness(selectedBundleId)
      setReadiness(latestReadiness)
      setReadinessError(null)
      if (!isPaperAutoTradingReady(latestReadiness)) {
        setSaveError(autoTradingReadinessMessage(latestReadiness))
        return
      }
      const selection = {
        recommendationIds: autoTradingStockInfo.map((stock) => stock.recommendationId),
        stockCodes: autoTradingStockInfo.map(stockCode).filter(Boolean),
        targets: autoTradingStockInfo.map(toAutoTradingTarget),
        idempotencyKey: createAutoTradingIdempotencyKey(),
        bundleId: selectedBundleId,
        stale: recommendationList?.stale ?? null,
        staleReason: recommendationList?.staleReason ?? null,
      }
      clearRunningAutoTradingState()
      savePendingAutoTradingSelection(selection)
      navigate('/trade/confirm', { state: { selection } })
    } catch (selectError) {
      setSaveError(errorMessage(selectError, '추천 종목을 확인하지 못했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleContinueSession = async () => {
    if (!activeSession) return
    const latestSession = await getActiveAutoTradingSessionWithStatus().catch(() => activeSession)
    if (!latestSession || !isActiveAutoTradingStatus(latestSession.status)) {
      clearPendingAutoTradingSelection()
      clearRunningAutoTradingState()
      setActiveSession(null)
      setStopError(null)
      void loadReadiness()
      void loadRecommendations()
      return
    }

    const storedSession = readRunningAutoTradingState()
    saveRunningAutoTradingState({
      session: latestSession,
      selection:
        storedSession?.session.sessionId === latestSession.sessionId
          ? storedSession.selection
          : null,
    })
    navigate('/trade/complete', { state: { session: latestSession, started: false } })
  }

  const handleStopSession = async () => {
    if (!activeSession || isStopping) return
    setIsStopping(true)
    setStopError(null)
    try {
      await stopAutoTradingSession(activeSession.sessionId)
      const activeSessionAfterStop = await waitForStoppedAutoTradingSession()
      if (isActiveAutoTradingStatus(activeSessionAfterStop?.status)) {
        setActiveSession(activeSessionAfterStop)
        setStopError('자동매매 중단 요청을 처리 중입니다. 잠시 후 다시 확인해주세요.')
        return
      }
      clearPendingAutoTradingSelection()
      clearRunningAutoTradingState()
      setActiveSession(null)
      setStopError(null)
      await loadReadiness()
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
        {recommendationList?.stale && (
          <div className="mt-3 rounded-[10px] bg-gray-50 px-3 py-2">
            <p className="text-[12px] leading-5 text-gray-500">
              최신 추천 갱신을 기다리는 중입니다: {staleSummary}. 자동매매 시작은 최신 추천에서만 가능합니다.
            </p>
          </div>
        )}
      </div>

      <div className="px-6">
        {(isCheckingSession || isLoading) && (
          <div aria-label="추천 종목 로딩 중">
            <RecommendationLoading />
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
            <p className="text-[15px] leading-6 text-gray-900">추천을 표시할 수 없습니다</p>
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
              장중 추천 캐시가 생성되면 이곳에 표시됩니다
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
            const detailId = stock.recommendationId
            const code = stockCode(stock).trim()
            const priceSummary = code ? priceSummaries[code] : null
            const resolvedPrice = firstValidNumber(stock.currentPrice, priceSummary?.currentPriceKrw)
            const resolvedChangeRate = firstValidNumber(stock.changeRate, priceSummary?.changeRate)
            const changeRate = formatChangeRate(resolvedChangeRate)
            const changeColor =
              validNumber(resolvedChangeRate) && resolvedChangeRate < 0 ? 'text-[#3985FF]' : 'text-toss-red'
            const isPriceLoading = Boolean(code && priceSummaries[code] === undefined && !validNumber(stock.currentPrice))

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
                    {isPriceLoading ? (
                      <span className="inline-block h-5 w-20 rounded bg-gray-100" aria-label="가격 정보 로딩 중" />
                    ) : (
                      <span className="text-[13px] leading-5 font-normal text-gray-500 tabular-nums">
                        {formatPrice(resolvedPrice, stock.currency || 'KRW')}
                      </span>
                    )}
                    {changeRate ? (
                      <span className={`text-[12px] leading-4 font-medium tabular-nums ${changeColor}`}>
                        {changeRate}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      <div className="px-6 mt-8">
        {!activeSession && readinessNotice && (
          <p className="mb-3 text-[13px] leading-5 text-gray-500">{readinessNotice}</p>
        )}
        {saveError && <p className="mb-3 text-[13px] leading-5 text-error">{saveError}</p>}
        <Button
          onClick={() => void handleConfirmSelection()}
          disabled={
            !hasAutoTradingTargets ||
            isSaving ||
            isCheckingSession ||
            Boolean(activeSession) ||
            isCheckingReadiness ||
            Boolean(readinessError) ||
            !canStartAutoTrading
          }
          variant={hasAutoTradingTargets && canStartAutoTrading ? 'primary' : 'secondary'}
          className="disabled:opacity-100"
        >
          {isSaving
            ? '확인 중...'
            : hasAutoTradingTargets && isCheckingReadiness
              ? '준비 상태 확인 중...'
              : hasAutoTradingTargets && isRecommendationStale
                ? '추천 갱신 대기 중'
              : hasAutoTradingTargets && !canStartAutoTrading
                ? '자동매매 준비 중'
                : '추천 전체 확인하기'}
        </Button>
      </div>
      {activeSession && (
        <ActiveSessionModal
          error={stopError}
          isStopping={isStopping}
          onContinue={() => void handleContinueSession()}
          onStop={() => void handleStopSession()}
        />
      )}
    </div>
  )
}
