import { Client } from '@stomp/stompjs'
import type { UTCTimestamp } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getStockChart,
  getStockChartTopic,
  getStockFinancial,
  getStockInfo,
  getStockPriceTopic,
  getStockSummary,
  getStockWebSocketUrl,
  type StockChart,
  type StockChartDataPoint,
  type StockChartRange,
  type StockChartType,
  type StockChartUpdate,
  type StockFinancial,
  type StockFinancialPeriod,
  type StockInfo,
  type StockSummary,
} from '../../apis/stocks'
import BackButton from '../../components/BackButton'
import StockChartComponent from '../../components/StockChart'
import { ApiError } from '../../lib/apiClient'
import { isTickerEcho, resolveStockDisplayName } from '../../lib/stockDisplay'

const periods: { label: string; value: StockChartRange }[] = [
  { label: '1일', value: '1D' },
  { label: '1주', value: '1W' },
  { label: '3달', value: '3M' },
  { label: '1년', value: '1Y' },
  { label: '5년', value: '5Y' },
  { label: '전체', value: 'ALL' },
]
const timeZoneSuffixPattern = /(?:Z|[+-]\d{2}:?\d{2})$/i
const detailTabs = ['차트', '종목정보'] as const
const financialPeriods: { label: string; value: StockFinancialPeriod }[] = [
  { label: '분기', value: 'QUARTER' },
  { label: '연간', value: 'YEAR' },
]
type DetailTab = (typeof detailTabs)[number]
type DisplayChartType = 'area' | 'candlestick'

interface RangeSliderProps {
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
  position: number
}

function RangeSlider({ leftLabel, leftValue, rightLabel, rightValue, position }: RangeSliderProps) {
  const clamped = Math.min(100, Math.max(0, position))
  return (
    <div>
      <div className="relative h-[6px] bg-[#E5E5E5] rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-[#9E9E9E] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          style={{ left: `calc(${clamped}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] leading-4 text-gray-400">{leftLabel}</span>
          <span className="text-[12px] leading-5 font-medium text-gray-700 tabular-nums">{leftValue}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] leading-4 text-gray-400">{rightLabel}</span>
          <span className="text-[12px] leading-5 font-medium text-gray-700 tabular-nums">{rightValue}</span>
        </div>
      </div>
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} aria-hidden="true" />
}

function SummarySkeleton() {
  return (
    <div aria-label="종목 시세 로딩 중">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-[22px] w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-2 h-5 w-52" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-[280px] rounded-2xl bg-[#FAFAFA] px-4 pt-7" aria-label="차트 로딩 중">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="mt-12 ml-6 h-3 w-[86%]" />
      <Skeleton className="mt-12 ml-2 h-3 w-[92%]" />
      <Skeleton className="mt-12 ml-12 h-3 w-[70%]" />
    </div>
  )
}

function PriceInfoSkeleton() {
  return (
    <div className="mt-7" aria-label="시세 정보 로딩 중">
      <Skeleton className="h-[6px] w-full rounded-full" />
      <div className="mt-3 flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="mt-7 h-[6px] w-full rounded-full" />
      <div className="mt-3 flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseFinancialNumber(value: string | undefined) {
  if (!value?.trim()) return null
  const parsed = Number(value.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function formatWon(value: number | null | undefined) {
  return validNumber(value) ? `${value.toLocaleString('ko-KR')}원` : '-'
}

function formatSignedWon(value: number | null | undefined) {
  if (!validNumber(value)) return '-'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR')}원`
}

function formatPercent(value: number | null | undefined) {
  if (!validNumber(value)) return '-'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`
}

function formatVolume(value: number | null | undefined) {
  return validNumber(value) ? `${value.toLocaleString('ko-KR')}주` : '-'
}

function formatTradingValue(value: number | null | undefined) {
  if (!validNumber(value)) return '-'
  if (Math.abs(value) >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조원`
  }
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억원`
  }
  return formatWon(value)
}

function formatFinancialValue(value: number | null, unit: string | undefined) {
  if (!validNumber(value)) return '-'
  if (unit === '억원' && Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조원`
  }
  return `${value.toLocaleString('ko-KR')}${unit ?? ''}`
}

function formatAsOfDate(date: string | null | undefined) {
  if (!date) return '기준일 없음'
  const parts = date.split('-')
  return parts.length === 3 ? `${parts[1]}월${parts[2]}일 기준` : `${date} 기준`
}

function movementColor(change: number | null | undefined) {
  if (!validNumber(change) || change === 0) return 'text-gray-500'
  return change > 0 ? 'text-toss-red' : 'text-[#3985FF]'
}

function mayLackCorporateFinancials(name: string) {
  return /(KODEX|TIGER|RISE|KBSTAR|KOSEF|HANARO|ACE|ARIRANG|SOL |PLUS |TIMEFOLIO|ETF|ETN|인버스|레버리지|선물)/i.test(
    name,
  )
}

function sliderPosition(current: number | null | undefined, low: number | null, high: number | null) {
  if (!validNumber(current) || !validNumber(low) || !validNumber(high) || low === high) return 50
  return ((current - low) / (high - low)) * 100
}

function toChartTime(time: string): string | UTCTimestamp {
  if (!time.includes('T')) return time
  const normalizedTime = timeZoneSuffixPattern.test(time) ? time : `${time}+09:00`
  const timestamp = Date.parse(normalizedTime)
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

function candlestickData(chart: StockChart | null) {
  return (chart?.data ?? [])
    .filter(
      (point) =>
        validNumber(point.open) &&
        validNumber(point.high) &&
        validNumber(point.low) &&
        validNumber(point.close),
    )
    .map((point) => ({
      time: toChartTime(point.time),
      open: point.open as number,
      high: point.high as number,
      low: point.low as number,
      close: point.close as number,
    }))
}

function upsertPoint(data: StockChartDataPoint[] | null, point: StockChartDataPoint) {
  const next = [...(data ?? [])]
  const lastIndex = next.length - 1
  if (lastIndex >= 0 && next[lastIndex].time === point.time) {
    next[lastIndex] = point
  } else {
    next.push(point)
  }
  return next
}

function parseSummaryUpdate(body: string) {
  try {
    const summary = JSON.parse(body) as Partial<StockSummary>
    if (
      typeof summary.ticker !== 'string' ||
      typeof summary.stockName !== 'string' ||
      typeof summary.currentPriceKrw !== 'number' ||
      typeof summary.changeAmountKrw !== 'number' ||
      typeof summary.changeRate !== 'number'
    ) {
      return null
    }
    return summary as StockSummary
  } catch {
    return null
  }
}

function parseChartUpdate(body: string) {
  try {
    const update = JSON.parse(body) as Partial<StockChartUpdate>
    if (
      typeof update.ticker !== 'string' ||
      update.range !== '1D' ||
      (update.type !== 'LINE' && update.type !== 'CANDLE') ||
      !update.point ||
      typeof update.point.time !== 'string'
    ) {
      return null
    }
    return update as StockChartUpdate
  } catch {
    return null
  }
}

function toFinancialBars(financial: StockFinancial | null) {
  if (!financial) return []
  const columns = financial.columns ?? []
  const rows = financial.rows ?? []
  const revenue = rows.find((row) => row.label === '매출액')?.values ?? []
  const operating = rows.find((row) => row.label === '영업 이익')?.values ?? []
  const net = rows.find((row) => row.label === '당기순이익')?.values ?? []

  return columns.map((label, index) => ({
    label,
    revenue: parseFinancialNumber(revenue[index]),
    operating: parseFinancialNumber(operating[index]),
    net: parseFinancialNumber(net[index]),
  }))
}

function FinancialBarChart({
  financial,
  isLoading,
  hasError,
  isFundLikeProduct,
  onRetry,
}: {
  financial: StockFinancial | null
  isLoading: boolean
  hasError: boolean
  isFundLikeProduct: boolean
  onRetry: () => void
}) {
  const data = useMemo(() => toFinancialBars(financial), [financial])
  const maximum = Math.max(
    0,
    ...data.flatMap((point) => [point.revenue, point.operating, point.net])
      .filter(validNumber)
      .map((value) => Math.abs(value)),
  )
  const latest = data[data.length - 1]
  const barHeight = (value: number | null) =>
    validNumber(value) && maximum > 0 ? `${Math.max(3, (Math.abs(value) / maximum) * 50)}%` : '0%'
  const barClassName = (value: number | null, color: string) =>
    `absolute left-0 w-[10px] rounded-sm ${color} ${
      validNumber(value) && value < 0 ? 'top-1/2 rounded-t-none' : 'bottom-1/2 rounded-b-none'
    }`

  if (isLoading) {
    return (
      <div className="mt-6" aria-label="재무 데이터 로딩 중">
        <div className="flex h-[150px] items-end justify-between px-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-end gap-[3px]">
              <Skeleton className="h-20 w-[10px]" />
              <Skeleton className="h-14 w-[10px]" />
              <Skeleton className="h-10 w-[10px]" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }
  if (hasError) {
    return (
      <div className="mt-6">
        <p className="text-[13px] leading-5 text-gray-500">
          {isFundLikeProduct
            ? 'ETF/ETN 등 상품은 기업 재무제표가 제공되지 않을 수 있습니다.'
            : '재무 데이터를 불러오지 못했습니다.'}
        </p>
        <button type="button" onClick={onRetry} className="mt-2 text-[13px] text-gray-700 underline">
          다시 시도
        </button>
      </div>
    )
  }
  if (data.length === 0) {
    return (
      <p className="mt-6 text-[13px] leading-5 text-gray-500">
        {isFundLikeProduct
          ? 'ETF/ETN 등 상품에는 기업 재무제표가 제공되지 않습니다.'
          : '표시할 재무 데이터가 없습니다.'}
      </p>
    )
  }

  const legends = [
    { color: '#D9D9D9', label: '매출액', value: latest?.revenue ?? null },
    { color: '#A3D977', label: '영업이익', value: latest?.operating ?? null },
    { color: '#F4C84A', label: '당기순이익', value: latest?.net ?? null },
  ]

  return (
    <div className="mt-6">
      <div className="relative pl-1">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" aria-hidden="true" />
        <div className="flex justify-between h-[150px]">
          {data.map((point) => (
            <div key={point.label} className="flex gap-[3px] h-full justify-center">
              <div className="relative h-full w-[10px]">
                <div className={barClassName(point.revenue, 'bg-[#D9D9D9]')} style={{ height: barHeight(point.revenue) }} />
              </div>
              <div className="relative h-full w-[10px]">
                <div className={barClassName(point.operating, 'bg-[#A3D977]')} style={{ height: barHeight(point.operating) }} />
              </div>
              <div className="relative h-full w-[10px]">
                <div className={barClassName(point.net, 'bg-[#F4C84A]')} style={{ height: barHeight(point.net) }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {data.map((point) => (
            <span key={point.label} className="text-[10px] leading-4 text-gray-400 text-center">
              {point.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-x-3">
        {legends.map((legend) => (
          <div key={legend.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: legend.color }} />
              <span className="text-[11px] leading-4 text-gray-500">{legend.label}</span>
            </div>
            <span className="text-[14px] leading-5 font-semibold text-gray-900 tabular-nums">
              {formatFinancialValue(legend.value, financial?.unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StockDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const ticker = (id ?? '').trim().toUpperCase()
  const navigationName = (location.state as { stockName?: string } | null)?.stockName?.trim()
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(false)
  const [summaryErrorCode, setSummaryErrorCode] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState<StockChartRange>('1Y')
  const [activeTab, setActiveTab] = useState<DetailTab>('차트')
  const [chartType, setChartType] = useState<DisplayChartType>('area')
  const [chart, setChart] = useState<StockChart | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState(false)
  const [financialPeriod, setFinancialPeriod] = useState<StockFinancialPeriod>('QUARTER')
  const [info, setInfo] = useState<StockInfo | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState(false)
  const [financial, setFinancial] = useState<StockFinancial | null>(null)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [financialError, setFinancialError] = useState(false)
  const [resolvedDisplayName, setResolvedDisplayName] = useState<{ ticker: string; name: string } | null>(null)
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const periodMenuRef = useRef<HTMLDivElement | null>(null)
  const cachedDisplayName = resolvedDisplayName?.ticker === ticker ? resolvedDisplayName.name : null
  const displayName = resolveStockDisplayName(ticker, summary?.stockName, navigationName, info?.nameKor, cachedDisplayName)
  const isFundLikeProduct = mayLackCorporateFinancials(displayName)

  const rememberDisplayName = useCallback(
    (candidate: string | null | undefined) => {
      const name = candidate?.trim()
      if (name && !isTickerEcho(name, ticker)) {
        setResolvedDisplayName({ ticker, name })
      }
    },
    [setResolvedDisplayName, ticker],
  )

  const loadSummary = useCallback(async () => {
    if (!ticker) {
      setSummaryLoading(false)
      setSummaryError(true)
      setSummaryErrorCode(null)
      return
    }
    setSummaryLoading(true)
    setSummaryError(false)
    setSummaryErrorCode(null)
    setSummary(null)
    try {
      const nextSummary = await getStockSummary(ticker)
      setSummary(nextSummary)
      rememberDisplayName(nextSummary.stockName)
    } catch (error) {
      setSummaryError(true)
      setSummaryErrorCode(error instanceof ApiError ? (error.code ?? null) : null)
    } finally {
      setSummaryLoading(false)
    }
  }, [rememberDisplayName, setSummary, setSummaryError, setSummaryErrorCode, setSummaryLoading, ticker])

  const loadFinancial = async () => {
    if (!ticker) return
    if (isFundLikeProduct) {
      setFinancial(null)
      setFinancialError(false)
      setFinancialLoading(false)
      return
    }
    setFinancialLoading(true)
    setFinancialError(false)
    try {
      setFinancial(await getStockFinancial(ticker, 'INCOME', financialPeriod))
    } catch {
      setFinancial(null)
      setFinancialError(true)
    } finally {
      setFinancialLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadSummary])

  useEffect(() => {
    if (!periodMenuOpen) return
    const handler = (event: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) {
        setPeriodMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [periodMenuOpen])

  useEffect(() => {
    if (activeTab !== '차트') return
    let current = true
    const timer = window.setTimeout(() => {
      if (!ticker) {
        setChartLoading(false)
        setChartError(true)
        return
      }
      setChartLoading(true)
      setChartError(false)
      const apiType: StockChartType = chartType === 'area' ? 'LINE' : 'CANDLE'
      void getStockChart(ticker, activePeriod, apiType)
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
  }, [activePeriod, activeTab, chartType, ticker])

  useEffect(() => {
    if (activeTab !== '종목정보') return
    let current = true
    const timer = window.setTimeout(() => {
      if (!ticker) {
        setInfoLoading(false)
        setFinancialLoading(false)
        setInfoError(true)
        setFinancialError(true)
        return
      }
      setInfo(null)
      setFinancial(null)
      setInfoLoading(true)
      setFinancialLoading(true)
      setInfoError(false)
      setFinancialError(false)
      void getStockInfo(ticker, financialPeriod)
        .then((nextInfo) => {
          if (current) {
            setInfo(nextInfo)
            rememberDisplayName(nextInfo.nameKor)
          }
        })
        .catch(() => {
          if (current) setInfoError(true)
        })
        .finally(() => {
          if (current) setInfoLoading(false)
        })

      if (isFundLikeProduct) {
        setFinancial(null)
        setFinancialError(false)
        setFinancialLoading(false)
        return
      }

      void getStockFinancial(ticker, 'INCOME', financialPeriod)
        .then((nextFinancial) => {
          if (current) setFinancial(nextFinancial)
        })
        .catch(() => {
          if (current) setFinancialError(true)
        })
        .finally(() => {
          if (current) setFinancialLoading(false)
        })
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [activeTab, financialPeriod, isFundLikeProduct, rememberDisplayName, ticker])

  useEffect(() => {
    if (!ticker) return
    const client = new Client({
      brokerURL: getStockWebSocketUrl(),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        client.subscribe(getStockPriceTopic(ticker), (message) => {
          const update = parseSummaryUpdate(message.body)
          if (update && update.ticker === ticker) {
            setSummary(update)
            rememberDisplayName(update.stockName)
            setSummaryError(false)
            setSummaryLoading(false)
          }
        })
        client.subscribe(getStockChartTopic(ticker), (message) => {
          const update = parseChartUpdate(message.body)
          if (!update || update.ticker !== ticker) return
          setChart((current) => {
            if (!current || current.range !== update.range || current.type !== update.type) return current
            return { ...current, data: upsertPoint(current.data, update.point) }
          })
        })
      },
    })
    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [rememberDisplayName, ticker])

  const linePoints = useMemo(() => lineData(chart), [chart])
  const candlePoints = useMemo(() => candlestickData(chart), [chart])
  const chartPointCount = chartType === 'area' ? linePoints.length : candlePoints.length
  const chartPrices = (chart?.data ?? []).flatMap((point) => {
    if (chartType === 'candlestick') {
      return [point.high, point.low].filter(validNumber)
    }
    return [point.price ?? point.close].filter(validNumber)
  })
  const highPrice = chartPrices.length > 0 ? Math.max(...chartPrices) : null
  const lowPrice = chartPrices.length > 0 ? Math.min(...chartPrices) : null
  const price = info?.price
  const selectedFinancialPeriod =
    financialPeriods.find((period) => period.value === financialPeriod)?.label ?? '분기'

  return (
    <div className="screen pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-px pt-4">
        {summaryLoading && !summary ? (
          <SummarySkeleton />
        ) : (
          <>
            <div className="flex items-start gap-2">
              <h1 className="min-w-0 flex-1 text-[24px] font-semibold leading-8 text-gray-900 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {displayName}
              </h1>
              <div className="mt-1 flex shrink-0 items-center gap-1 px-2.5 h-[22px] rounded-full bg-gray-100 text-gray-500">
                <span className="text-[11px] font-medium">{summary?.ticker ?? ticker}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" />
                </svg>
              </div>
            </div>
            {summary && (
              <>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-[28px] font-semibold leading-[1.25] text-gray-900 tabular-nums">
                    {formatWon(summary.currentPriceKrw)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[13px] leading-5 text-gray-500">지난 정규장보다</span>
                  <span className={`text-[14px] leading-5 font-medium tabular-nums ${movementColor(summary.changeAmountKrw)}`}>
                    {formatSignedWon(summary.changeAmountKrw)} ({formatPercent(summary.changeRate)})
                  </span>
                </div>
              </>
            )}
            {summaryError && !summary && (
              <div className="mt-3">
                <p className="text-[13px] leading-5 text-gray-500">
                  {summaryErrorCode === 'STOCK404_01'
                    ? '상세 조회 준비가 되지 않은 종목입니다. 잠시 후 다시 시도해 주세요.'
                    : '종목 시세를 불러오지 못했습니다.'}
                </p>
                <button type="button" onClick={() => void loadSummary()} className="mt-1 text-[13px] text-gray-700 underline">
                  다시 시도
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="screen-px mt-6">
        <div className="flex border-b border-gray-100">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-[15px] font-normal leading-6 border-b-2 transition-colors ${
                activeTab === tab ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === '차트' && (
        <div className="animate-fade-in-up">
          <div className="screen-px mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChartType('area')}
                className={`text-[13px] font-medium px-3 py-1 rounded-lg transition-colors ${chartType === 'area' ? 'bg-toss-blue text-white' : 'text-gray-500'}`}
              >
                라인
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`text-[13px] font-medium px-3 py-1 rounded-lg transition-colors ${chartType === 'candlestick' ? 'bg-toss-blue text-white' : 'text-gray-500'}`}
              >
                캔들
              </button>
            </div>
            <div className="flex items-center gap-3 text-[12px] tabular-nums">
              <span className="text-toss-red font-medium">최고 {formatWon(highPrice)}</span>
              <span className="text-toss-blue font-medium">최저 {formatWon(lowPrice)}</span>
            </div>
          </div>

          <div className="screen-px mt-3">
            {chartLoading && <ChartSkeleton />}
            {!chartLoading && chartError && (
              <p className="h-[280px] pt-5 text-[13px] text-gray-500">차트 데이터를 불러오지 못했습니다.</p>
            )}
            {!chartLoading && !chartError && chartPointCount === 0 && (
              <p className="h-[280px] pt-5 text-[13px] text-gray-500">표시할 차트 데이터가 없습니다.</p>
            )}
            {!chartLoading && !chartError && chartPointCount > 0 && (
              <StockChartComponent
                type={chartType}
                lineData={chartType === 'area' ? linePoints : undefined}
                candlestickData={chartType === 'candlestick' ? candlePoints : undefined}
                height={280}
                showTime={activePeriod === '1D'}
              />
            )}
          </div>

          <div className="screen-px mt-4">
            <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setActivePeriod(period.value)}
                  className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    activePeriod === period.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="screen-px mt-5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() =>
                navigate(`/stock/${encodeURIComponent(ticker)}/daily-prices`, {
                  state: { stockName: displayName },
                })
              }
              className="flex items-center gap-2 text-[14px] text-gray-600 font-medium"
            >
              일별 시세 보기
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {activeTab === '종목정보' && (
        <div className="bg-[#F5F5F5] mt-3 animate-fade-in-up">
          <div className="bg-white px-6 pt-6 pb-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[18px] font-bold leading-7 text-gray-900">시세</h3>
              <span className="text-[11px] leading-4 text-gray-400">{formatAsOfDate(price?.asOfDate)}</span>
            </div>

            {infoLoading && <PriceInfoSkeleton />}
            {infoError && !infoLoading && (
              <p className="mt-7 text-[13px] leading-5 text-gray-500">시세 정보를 불러오지 못했습니다.</p>
            )}
            {!infoLoading && !infoError && (
              <>
                <div className="mt-7">
                  <RangeSlider
                    leftLabel="1일 최저가"
                    leftValue={formatWon(price?.dayLowPriceKrw)}
                    rightLabel="1일 최고가"
                    rightValue={formatWon(price?.dayHighPriceKrw)}
                    position={sliderPosition(summary?.currentPriceKrw ?? price?.currentPriceKrw, price?.dayLowPriceKrw ?? null, price?.dayHighPriceKrw ?? null)}
                  />
                </div>
                <div className="mt-6">
                  <RangeSlider
                    leftLabel="52주 최저가"
                    leftValue={formatWon(price?.week52LowPriceKrw)}
                    rightLabel="52주 최고가"
                    rightValue={formatWon(price?.week52HighPriceKrw)}
                    position={sliderPosition(summary?.currentPriceKrw ?? price?.currentPriceKrw, price?.week52LowPriceKrw ?? null, price?.week52HighPriceKrw ?? null)}
                  />
                </div>
                <div className="mt-7 grid grid-cols-2 gap-y-3 gap-x-4">
                  {[
                    { label: '시가', value: formatWon(price?.openPriceKrw) },
                    { label: '거래량', value: formatVolume(price?.volume) },
                    { label: '현재가', value: formatWon(summary?.currentPriceKrw ?? price?.currentPriceKrw) },
                    { label: '거래대금', value: formatTradingValue(price?.tradingValueKrw) },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-[12px] leading-5 text-gray-400">{stat.label}</span>
                      <span className="text-[13px] leading-5 font-medium text-gray-900 tabular-nums">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-7 pt-5 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  navigate(`/stock/${encodeURIComponent(ticker)}/daily-prices`, {
                    state: { stockName: displayName },
                  })
                }
                className="flex items-center gap-1.5 text-[13px] leading-5 font-normal text-gray-500"
              >
                일별 시세 보기
                <svg width="6" height="10" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />

          <div className="bg-white px-6 pt-6 pb-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[18px] font-bold leading-7 text-gray-900">재무</h3>
              <div ref={periodMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPeriodMenuOpen((open) => !open)}
                  className="flex items-center gap-1 text-[12px] leading-5 text-gray-400 active:text-gray-600 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={periodMenuOpen}
                >
                  {selectedFinancialPeriod}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${periodMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {periodMenuOpen && (
                  <ul
                    role="listbox"
                    className="absolute right-0 top-full mt-2 min-w-[80px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 py-1 z-10 animate-fade-in"
                  >
                    {financialPeriods.map((period) => (
                      <li key={period.value} role="option" aria-selected={financialPeriod === period.value}>
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialPeriod(period.value)
                            setPeriodMenuOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-[12px] leading-5 transition-colors ${
                            financialPeriod === period.value ? 'text-gray-900 font-medium' : 'text-gray-500'
                          } hover:bg-gray-50`}
                        >
                          {period.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <FinancialBarChart
              financial={financial}
              isLoading={financialLoading}
              hasError={financialError}
              isFundLikeProduct={isFundLikeProduct}
              onRetry={() => void loadFinancial()}
            />

            <div className="mt-7 pt-5 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                onClick={() =>
                  navigate(`/stock/${encodeURIComponent(ticker)}/financials`, {
                    state: { stockName: displayName },
                  })
                }
                className="flex items-center gap-1.5 text-[13px] leading-5 font-normal text-gray-500"
              >
                재무제표 보기
                <svg width="6" height="10" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />
        </div>
      )}
    </div>
  )
}
