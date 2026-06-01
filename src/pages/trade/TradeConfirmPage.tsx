import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DEFAULT_AUTO_TRADING_SETTINGS,
  getAutoTradingReadiness,
  getRunningAutoTradingSession,
  startAutoTradingSession,
  type AutoTradingReadiness,
  type AutoTradingSession,
} from '../../apis/autoTrading'
import { getRecommendations, type RecommendationInfo } from '../../apis/recommendations'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'
import { ApiError } from '../../lib/apiClient'
import {
  createAutoTradingIdempotencyKey,
  readPendingAutoTradingSelection,
  savePendingAutoTradingSelection,
  saveRunningAutoTradingState,
  type AutoTradingTarget,
  type PendingAutoTradingSelection,
} from '../../lib/autoTradingStorage'
import {
  autoTradingReadinessMessage,
  isPaperAutoTradingReady,
} from '../../lib/autoTradingReadiness'

interface TradeConfirmRouteState {
  selection?: PendingAutoTradingSelection
}

function stockName(stock: RecommendationInfo) {
  return stock.stockName || stock.companyName || stock.stockCode || stock.tickerCode || '추천 종목'
}

function stockCode(stock: RecommendationInfo) {
  return stock.stockCode || stock.tickerCode || ''
}

function toTarget(stock: RecommendationInfo): AutoTradingTarget {
  return {
    recommendationId: stock.recommendationId,
    stockName: stockName(stock),
    stockCode: stockCode(stock),
    riskLevel: stock.riskLevel,
  }
}

function fromSelectedRecommendations(recommendations: RecommendationInfo[]) {
  const selected = recommendations.filter(
    (stock): stock is RecommendationInfo & { recommendationId: number } =>
      Boolean(stock.isSelected) && stock.recommendationId != null,
  )
  if (selected.length === 0) return null
  return {
    recommendationIds: selected.map((stock) => stock.recommendationId),
    stockCodes: selected.map(stockCode).filter(Boolean),
    targets: selected.map(toTarget),
    idempotencyKey: createAutoTradingIdempotencyKey(),
  } satisfies PendingAutoTradingSelection
}

function formatRiskLevel(value: string | null) {
  const levels: Record<string, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
  }
  return levels[value?.toLowerCase() ?? ''] ?? '정보 없음'
}

function startErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return '로그인이 필요합니다.'
  }
  if (error instanceof ApiError && error.code === 'AUTO_TRADING409_01') {
    return '이미 실행 중인 AI 자동매매가 있습니다.'
  }
  return error instanceof Error && error.message
    ? error.message
    : 'AI 자동매매 시작에 실패했습니다. 잠시 후 다시 시도해주세요.'
}

export default function TradeConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeSelection = (location.state as TradeConfirmRouteState | null)?.selection ?? null
  const [selection, setSelection] = useState<PendingAutoTradingSelection | null>(
    () => routeSelection ?? readPendingAutoTradingSelection(),
  )
  const [activeSession, setActiveSession] = useState<AutoTradingSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<AutoTradingReadiness | null>(null)
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(true)
  const [readinessError, setReadinessError] = useState<string | null>(null)

  const canStartAutoTrading = isPaperAutoTradingReady(readiness)
  const readinessNotice =
    readinessError ||
    (readiness && !canStartAutoTrading ? autoTradingReadinessMessage(readiness) : null)

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setLoadError(null)
      void (async () => {
        try {
          const session = await getRunningAutoTradingSession()
          if (!current) return
          if (session) {
            setActiveSession(session)
            setIsCheckingReadiness(false)
          } else {
            try {
              const readinessResult = await getAutoTradingReadiness()
              if (!current) return
              setReadiness(readinessResult)
              setReadinessError(null)
            } catch (readinessLoadError) {
              if (!current) return
              setReadiness(null)
              setReadinessError(readinessLoadError instanceof Error ? readinessLoadError.message : 'AI 자동매매 준비 상태를 확인하지 못했습니다.')
            } finally {
              if (current) setIsCheckingReadiness(false)
            }
          }

          let nextSelection = routeSelection ?? readPendingAutoTradingSelection()
          if (!nextSelection) {
            const result = await getRecommendations()
            nextSelection = fromSelectedRecommendations(result.recommendations ?? [])
          }
          if (!current) return
          if (nextSelection) {
            savePendingAutoTradingSelection(nextSelection)
          }
          setSelection(nextSelection)
        } catch (error) {
          if (current) {
            setLoadError(error instanceof Error ? error.message : '선택된 종목을 불러오지 못했습니다.')
            setIsCheckingReadiness(false)
          }
        } finally {
          if (current) setIsLoading(false)
        }
      })()
    }, 0)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [routeSelection])

  const handleStart = async () => {
    if (!selection || selection.recommendationIds.length === 0 || isStarting || activeSession) return
    setIsStarting(true)
    setStartError(null)
    try {
      const currentSession = await getRunningAutoTradingSession()
      if (currentSession) {
        setActiveSession(currentSession)
        setStartError('이미 실행 중인 AI 자동매매가 있습니다.')
        return
      }
      const latestReadiness = await getAutoTradingReadiness()
      setReadiness(latestReadiness)
      setReadinessError(null)
      if (!isPaperAutoTradingReady(latestReadiness)) {
        setStartError(autoTradingReadinessMessage(latestReadiness))
        return
      }
      const session = await startAutoTradingSession(
        {
          recommendationIds: selection.recommendationIds,
          ...DEFAULT_AUTO_TRADING_SETTINGS,
        },
        selection.idempotencyKey,
      )
      saveRunningAutoTradingState({ session, selection })
      navigate('/trade/complete', {
        replace: true,
        state: { session, selection, started: true },
      })
    } catch (error) {
      setStartError(startErrorMessage(error))
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="flex-1 screen-px pt-4">
        <h1 className="section-title">선택한 종목으로 AI 자동매매를 시작할까요?</h1>
        <p className="body-copy mt-3">
          AI가 선택된 추천 종목을 기준으로 매수·매도 타이밍을 판단합니다.
        </p>

        {isLoading && (
          <div className="mt-8 rounded-[15px] bg-gray-50 p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
            <div className="mt-5 h-16 animate-pulse rounded bg-gray-100" />
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mt-8 rounded-[15px] bg-gray-50 p-5">
            <p className="text-[15px] leading-6 text-gray-900">선택 종목을 확인하지 못했습니다</p>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">{loadError}</p>
          </div>
        )}

        {!isLoading && !loadError && (!selection || selection.targets.length === 0) && (
          <div className="mt-8 rounded-[15px] bg-gray-50 p-5">
            <p className="text-[15px] leading-6 text-gray-900">선택된 종목이 없습니다.</p>
            <button
              type="button"
              onClick={() => navigate('/recommend', { replace: true })}
              className="mt-3 text-[13px] font-medium leading-5 text-toss-blue"
            >
              추천 종목 선택하기
            </button>
          </div>
        )}

        {!isLoading && !loadError && selection && selection.targets.length > 0 && (
          <div className="mt-8 rounded-[15px] bg-gray-50 p-5">
            <h2 className="text-[15px] font-medium leading-6 text-gray-900">자동매매 대상 종목</h2>
            <div className="mt-3 space-y-3">
              {selection.targets.map((target) => (
                <div
                  key={`${target.recommendationId ?? target.stockCode}-${target.stockCode}`}
                  className="rounded-[12px] bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-medium leading-6 text-gray-900">
                      {target.stockName}
                    </p>
                    <p className="shrink-0 text-[13px] leading-5 text-gray-500">{target.stockCode}</p>
                  </div>
                  <div className="mt-2 text-[13px] leading-5 text-gray-500">
                    <p>리스크 {formatRiskLevel(target.riskLevel)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSession && (
          <div className="mt-4 rounded-[15px] bg-toss-blue-light px-5 py-4 text-[14px] leading-6 text-gray-700">
            현재 AI 자동매매가 실행 중이므로 새 세션을 시작할 수 없습니다.
          </div>
        )}

        {!activeSession && readinessNotice && (
          <div className="mt-4 rounded-[15px] bg-gray-50 px-5 py-4 text-[14px] leading-6 text-gray-600">
            {readinessNotice}
          </div>
        )}

        <div className="mt-5 space-y-1 text-[13px] leading-5 text-gray-400">
          <p>자동매매는 시장 상황과 모델 판단에 따라 체결되지 않을 수 있습니다.</p>
          <p>체결 내역은 실행 이후 포트폴리오에서 확인할 수 있습니다.</p>
        </div>
      </div>

      <div className="screen-px flex flex-col gap-3">
        {startError && <p className="text-[13px] leading-5 text-error">{startError}</p>}
        <Button
          onClick={() => void handleStart()}
          disabled={
            isLoading ||
            Boolean(loadError) ||
            !selection ||
            Boolean(activeSession) ||
            isStarting ||
            isCheckingReadiness ||
            Boolean(readinessError) ||
            !canStartAutoTrading
          }
        >
          {isStarting
            ? '시작 중...'
            : activeSession
              ? 'AI 자동매매 실행 중'
            : isCheckingReadiness
              ? '준비 상태 확인 중...'
              : !canStartAutoTrading
                ? '자동매매 준비 중'
                : 'AI 자동매매 시작'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/recommend')}>
          취소
        </Button>
      </div>
    </div>
  )
}
