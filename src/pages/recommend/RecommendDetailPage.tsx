import type { UTCTimestamp } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getRunningAutoTradingSession,
  type AutoTradingSession,
} from '../../apis/autoTrading'
import {
  getRecommendationDetail,
  getRecommendationReasons,
  selectRecommendations,
  type RecommendationDetail,
  type RecommendationSelectionItem,
} from '../../apis/recommendations'
import { getStockChart, getStockSummary, type StockChart, type StockSummary } from '../../apis/stocks'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'
import InfoCard from '../../components/InfoCard'
import StockChartComponent from '../../components/StockChart'
import {
  clearRunningAutoTradingState,
  createAutoTradingIdempotencyKey,
  savePendingAutoTradingSelection,
} from '../../lib/autoTradingStorage'

interface RecommendRouteState {
  stockCode?: string
}

type DetailSectionKey = keyof NonNullable<RecommendationDetail['sections']>

interface SectionContext {
  stockName: string
  stockCode: string
  price: number | null
  currency: string | null
  rank: number | null | undefined
  scoreText: string | null
  riskLabel: string | null
}

const REASON_LABELS: Record<string, string> = {
  MODEL_RANKING_SIGNAL: 'AI 모델이 최근 가격 흐름과 뉴스 점수를 반영해 추천 순위에 포함했습니다.',
  expected_return_unavailable_not_calibrated: '예상 수익률은 아직 보정되지 않아 표시하지 않습니다.',
}

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function firstValidNumber(...values: Array<number | null | undefined>) {
  return values.find(validNumber) ?? null
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function parseRecommendationId(rawId: string | undefined) {
  if (!rawId) return null
  const parsed = Number(rawId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function displayName(detail: RecommendationDetail | null) {
  return detail?.stockName || detail?.companyName || detail?.stockCode || detail?.tickerCode || '추천 종목'
}

function displayCode(detail: RecommendationDetail | null, fallback = '') {
  return detail?.stockCode || detail?.tickerCode || fallback
}

function formatPrice(value: number | null | undefined, currency: string | null | undefined) {
  if (!validNumber(value)) return '가격 정보 없음'
  const suffix = !currency || currency === 'KRW' ? '원' : ` ${currency}`
  return `${value.toLocaleString('ko-KR')}${suffix}`
}

function formatPercent(value: number | null | undefined) {
  if (!validNumber(value)) return null
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`
}

function formatScore(value: number | null | undefined) {
  if (!validNumber(value)) return null
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 3 })
}

function formatRiskLevel(level: string | null | undefined) {
  const normalized = String(level ?? '').trim().toLowerCase()
  if (!normalized) return null
  const labels: Record<string, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
  }
  return labels[normalized] ?? level
}

function humanizeReason(rawReason: string | null | undefined) {
  const tokens = String(rawReason ?? '')
    .split(';')
    .map((token) => token.trim())
    .filter(Boolean)
  if (tokens.length === 0) return null
  return tokens
    .map((token) => REASON_LABELS[token] ?? token.replaceAll('_', ' ').toLowerCase())
    .join(' ')
}

function sectionText(
  detail: RecommendationDetail | null,
  key: DetailSectionKey,
  context: SectionContext,
) {
  const sections = detail?.sections
  const raw = sections?.[key] || detail?.[key]
  if (raw) return key === 'recommendReason' ? humanizeReason(raw) || raw : raw

  if (key === 'recommendReason') {
    const reason = humanizeReason(detail?.recommendReason)
    const rankText = validNumber(context.rank) ? ` 추천 순위는 ${context.rank}위입니다.` : ''
    const scoreText = context.scoreText ? ` 모델 점수는 ${context.scoreText}입니다.` : ''
    return `${reason || 'AI 모델 추천 결과가 생성되었습니다.'}${rankText}${scoreText}`.trim()
  }
  if (key === 'companySummary') {
    return `${context.stockName}${context.stockCode ? `(${context.stockCode})` : ''}의 기본 정보는 아직 상세 데이터와 연결되지 않았습니다. 현재 화면은 AI 추천 결과와 시세 데이터를 기준으로 표시됩니다.`
  }
  if (key === 'growthPoint') {
    return '성장성 세부 지표는 아직 연결되지 않았습니다. 현재는 모델 순위 신호와 장전 뉴스 점수가 추천 판단에 반영됩니다.'
  }
  if (key === 'priceAttractiveness') {
    const priceText = validNumber(context.price)
      ? `최근 시세 기준 현재가는 ${formatPrice(context.price, context.currency)}입니다.`
      : '현재가 데이터가 연결되면 가격 기준 판단을 함께 표시합니다.'
    return `${priceText} 목표가와 적정가 모델은 아직 보정 전입니다.`
  }
  if (key === 'risk') {
    return context.riskLabel
      ? `현재 모델 기준 리스크는 ${context.riskLabel} 수준입니다.`
      : '리스크 상세 평가는 아직 연결되지 않았습니다.'
  }
  return '아직 상세 내용이 없습니다.'
}

function toChartTime(time: string): string | UTCTimestamp {
  if (!time.includes('T')) return time
  const timestamp = Date.parse(`${time}+09:00`)
  return Number.isFinite(timestamp) ? (Math.floor(timestamp / 1000) as UTCTimestamp) : time.slice(0, 10)
}

function lineData(chart: StockChart | null) {
  return (chart?.data ?? [])
    .filter((point) => validNumber(point.price ?? point.close))
    .map((point) => ({
      time: toChartTime(point.time),
      value: (point.price ?? point.close) as number,
    }))
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} aria-hidden="true" />
}

export default function RecommendDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const routeState = location.state as RecommendRouteState | null
  const fallbackStockCode = typeof routeState?.stockCode === 'string' ? routeState.stockCode : ''
  const recommendationId = parseRecommendationId(id)

  const [detail, setDetail] = useState<RecommendationDetail | null>(null)
  const [reasons, setReasons] = useState<RecommendationDetail | null>(null)
  const [chart, setChart] = useState<StockChart | null>(null)
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reasonsError, setReasonsError] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [activeSession, setActiveSession] = useState<AutoTradingSession | null>(null)
  const [sessionCheckError, setSessionCheckError] = useState<string | null>(null)

  const visibleDetail = reasons ?? detail
  const currentStockCode = displayCode(visibleDetail, fallbackStockCode).trim()
  const chartData = useMemo(() => lineData(chart), [chart])
  const selectionPayload = useMemo<RecommendationSelectionItem | null>(() => {
    if (visibleDetail?.recommendationId != null) {
      return currentStockCode
        ? { recommendationId: visibleDetail.recommendationId, stockCode: currentStockCode }
        : { recommendationId: visibleDetail.recommendationId }
    }
    return currentStockCode ? { stockCode: currentStockCode } : null
  }, [currentStockCode, visibleDetail])

  const loadDetail = useCallback(async () => {
    if (recommendationId == null) {
      setIsLoading(false)
      setError('올바르지 않은 추천 종목 ID입니다.')
      return
    }

    setIsLoading(true)
    setError(null)
    setReasonsError(null)
    setSaveError(null)
    setDetail(null)
    setReasons(null)
    try {
      const nextDetail = await getRecommendationDetail(recommendationId)
      setDetail(nextDetail)
      const code = displayCode(nextDetail, fallbackStockCode).trim()
      if (code) {
        try {
          const nextReasons = await getRecommendationReasons(code)
          setReasons(nextReasons)
        } catch (reasonError) {
          setReasonsError(errorMessage(reasonError, '추천 사유를 불러오지 못했습니다.'))
        }
      }
    } catch (loadError) {
      setError(errorMessage(loadError, '추천 종목 상세를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }, [fallbackStockCode, recommendationId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadDetail])

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      if (!currentStockCode) {
        setChart(null)
        setChartLoading(false)
        setChartError(false)
        return
      }

      setChartLoading(true)
      setChartError(false)
      void getStockChart(currentStockCode, '3M', 'LINE')
        .then((result) => {
          if (current) setChart(result)
        })
        .catch(() => {
          if (current) {
            setChart(null)
            setChartError(true)
          }
        })
        .finally(() => {
          if (current) setChartLoading(false)
        })
    }, 0)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [currentStockCode])

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      if (!currentStockCode) {
        setSummary(null)
        return
      }

      void getStockSummary(currentStockCode)
        .then((result) => {
          if (current) setSummary(result)
        })
        .catch(() => {
          if (current) setSummary(null)
        })
    }, 0)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [currentStockCode])

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      void getRunningAutoTradingSession()
        .then((session) => {
          if (!current) return
          setActiveSession(session)
        })
        .catch((sessionError) => {
          if (current) {
            setSessionCheckError(errorMessage(sessionError, '자동매매 실행 상태를 확인하지 못했습니다.'))
          }
        })
        .finally(() => {
          if (current) setIsCheckingSession(false)
        })
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [])

  const handleSelectForAutoTrading = async () => {
    if (!selectionPayload || isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const session = await getRunningAutoTradingSession()
      if (session) {
        setActiveSession(session)
        return
      }
      const result = await selectRecommendations(selectionPayload)
      const selection = {
        recommendationIds: result.recommendationIds,
        stockCodes: result.stockCodes,
        targets: [
          {
            recommendationId: visibleDetail?.recommendationId ?? null,
            stockName: displayName(visibleDetail),
            stockCode: currentStockCode,
            riskLevel: visibleDetail?.riskLevel ?? null,
          },
        ],
        idempotencyKey: createAutoTradingIdempotencyKey(),
      }
      clearRunningAutoTradingState()
      savePendingAutoTradingSelection(selection)
      navigate('/trade/confirm', { state: { selection } })
    } catch (selectError) {
      setSaveError(errorMessage(selectError, '추천 종목 선택을 저장하지 못했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="screen pb-10 animate-fade-in-up">
        <div className="px-6 pt-[52px]">
          <BackButton />
        </div>
        <div className="screen-header pt-4 pb-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-5 w-44" />
          <Skeleton className="mt-3 h-8 w-56" />
        </div>
        <div className="screen-px mt-4">
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
        <div className="screen-px mt-4 space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-[15px]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen pb-10 animate-fade-in-up">
        <div className="px-6 pt-[52px]">
          <BackButton />
        </div>
        <div className="screen-px pt-8">
          <div className="rounded-[15px] bg-gray-50 px-5 py-6">
            <p className="text-[15px] leading-6 text-gray-900">추천 상세를 불러오지 못했습니다</p>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => void loadDetail()}
              className="mt-4 text-[13px] font-medium leading-5 text-toss-blue"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  const latestChartPrice = chartData.length > 0 ? chartData[chartData.length - 1].value : null
  const resolvedPrice = firstValidNumber(visibleDetail?.currentPrice, summary?.currentPriceKrw, latestChartPrice)
  const resolvedCurrency = visibleDetail?.currency || chart?.currency || 'KRW'
  const changeRateValue = firstValidNumber(visibleDetail?.changeRate, summary?.changeRate)
  const changeRate = formatPercent(changeRateValue)
  const score = formatScore(visibleDetail?.score)
  const riskLabel = formatRiskLevel(visibleDetail?.riskLevel)
  const context: SectionContext = {
    stockName: displayName(visibleDetail),
    stockCode: currentStockCode,
    price: resolvedPrice,
    currency: resolvedCurrency,
    rank: visibleDetail?.rank,
    scoreText: score,
    riskLabel,
  }

  return (
    <div className="screen pb-10 animate-fade-in-up">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-header pt-4 pb-2">
        <h1 className="section-title">{displayName(visibleDetail)}</h1>
        <p className="body-copy mt-2">
          {currentStockCode ? `${currentStockCode} · AI 추천 상세` : 'AI 추천 상세'}
        </p>
        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-[10px] bg-toss-blue-light px-3 py-1.5">
          <span className="shrink-0 text-[13px] leading-5 font-medium text-toss-blue">
            {riskLabel ? `리스크 ${riskLabel}` : '추천 분석'}
          </span>
          <span className="min-w-0 truncate text-[12px] leading-5 text-gray-500">
            {score ? `AI 점수 ${score}` : visibleDetail?.userProfileSummary || '사용자 성향 분석 결과'}
          </span>
        </div>
      </div>

      <div className="screen-px mt-4 mb-2">
        {chartLoading && <Skeleton className="h-[200px] w-full rounded-2xl" />}
        {!chartLoading && chartData.length > 0 && <StockChartComponent type="area" lineData={chartData} height={200} />}
        {!chartLoading && chartData.length === 0 && (
          <div className="flex h-[200px] items-center justify-center rounded-2xl bg-gray-50 px-4 text-center">
            <p className="text-[13px] leading-5 text-gray-500">
              {chartError ? '차트 데이터를 불러오지 못했습니다' : '차트 데이터가 없습니다'}
            </p>
          </div>
        )}
      </div>

      <div className="screen-px mt-4">
        <div className="rounded-[15px] bg-gray-50 p-5">
          <div className="flex justify-between gap-4 text-[15px] leading-6">
            <span className="text-gray-500">현재가</span>
            <span className="font-medium text-gray-900 tabular-nums">
              {formatPrice(resolvedPrice, resolvedCurrency)}
            </span>
          </div>
          <div className="mt-2 flex justify-between gap-4 text-[15px] leading-6">
            <span className="text-gray-500">등락률</span>
            <span
              className={`font-medium tabular-nums ${
                !validNumber(changeRateValue)
                  ? 'text-gray-500'
                  : changeRateValue < 0
                    ? 'text-[#3985FF]'
                    : 'text-toss-red'
              }`}
            >
              {changeRate ?? '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="screen-px space-y-4 mt-4">
        {reasonsError && <p className="text-[13px] leading-5 text-gray-500">{reasonsError}</p>}
        <InfoCard title="추천 이유">
          <p>{sectionText(visibleDetail, 'recommendReason', context)}</p>
        </InfoCard>

        <InfoCard title="기업 정보 요약">
          <p>{sectionText(visibleDetail, 'companySummary', context)}</p>
        </InfoCard>

        <InfoCard title="성장성 & 투자 포인트">
          <p>{sectionText(visibleDetail, 'growthPoint', context)}</p>
        </InfoCard>

        <InfoCard title="현재 가격 매력도">
          <p>{sectionText(visibleDetail, 'priceAttractiveness', context)}</p>
        </InfoCard>

        <InfoCard title="리스크">
          <p>{sectionText(visibleDetail, 'risk', context)}</p>
        </InfoCard>
      </div>

      <div className="screen-px mt-8">
        {activeSession && (
          <div className="mb-4 rounded-[15px] bg-toss-blue-light px-5 py-4">
            <p className="text-[14px] leading-6 text-gray-700">
              현재 AI 자동매매가 실행 중입니다. 새 종목을 선택하려면 추천 탭에서 기존 세션을
              먼저 중단해주세요.
            </p>
            <button
              type="button"
              onClick={() => navigate('/trade/complete', { state: { session: activeSession, started: false } })}
              className="mt-2 text-[13px] font-medium leading-5 text-toss-blue"
            >
              자동매매 현황 보기
            </button>
          </div>
        )}
        {sessionCheckError && <p className="mb-3 text-[13px] leading-5 text-error">{sessionCheckError}</p>}
        {saveError && <p className="mb-3 text-[13px] leading-5 text-error">{saveError}</p>}
        <Button
          onClick={() => void handleSelectForAutoTrading()}
          disabled={!selectionPayload || isSaving || isCheckingSession || Boolean(activeSession) || Boolean(sessionCheckError)}
        >
          {isSaving ? '저장 중...' : activeSession ? 'AI 자동매매 실행 중' : '자동매매 대상으로 선택하기'}
        </Button>
      </div>
    </div>
  )
}
