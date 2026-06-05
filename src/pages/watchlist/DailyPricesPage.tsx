import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getStockDailyPrices,
  getStockSummary,
  type StockDailyPriceItem,
  type StockSummary,
} from '../../apis/stocks'
import { resolveStockDisplayName } from '../../lib/stockDisplay'

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function formatPrice(value: number | null | undefined) {
  return validNumber(value) ? `${value.toLocaleString('ko-KR')}원` : '-'
}

function formatRate(value: number | null | undefined) {
  if (!validNumber(value)) return '-'
  return `${value > 0 ? '+' : ''}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`
}

function formatDate(value: string) {
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[1]}.${parts[2]}` : value
}

function formatVolume(value: number | null | undefined) {
  return validNumber(value) ? value.toLocaleString('ko-KR') : '-'
}

function rateColor(value: number | null | undefined) {
  if (!validNumber(value) || value === 0) return 'text-gray-500'
  return value > 0 ? 'text-toss-red' : 'text-[#3985FF]'
}

function DailyPricesSkeleton() {
  return (
    <div aria-label="일별 시세 로딩 중">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="flex items-center justify-between py-2.5">
          <div className="h-5 w-10 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-12 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

export default function DailyPricesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const ticker = (id ?? '').trim().toUpperCase()
  const navigationName = (location.state as { stockName?: string } | null)?.stockName?.trim()
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [rows, setRows] = useState<StockDailyPriceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const displayName = resolveStockDisplayName(ticker, summary?.stockName, navigationName)

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      if (!ticker) {
        setIsLoading(false)
        setHasError(true)
        setSummary(null)
        setRows([])
        return
      }
      setIsLoading(true)
      setHasError(false)
      setSummary(null)
      setRows([])
      void getStockSummary(ticker)
        .then((nextSummary) => {
          if (current) setSummary(nextSummary)
        })
        .catch(() => undefined)
      void getStockDailyPrices(ticker)
        .then((daily) => {
          if (current) setRows(daily.items ?? [])
        })
        .catch(() => {
          if (current) setHasError(true)
        })
        .finally(() => {
          if (current) setIsLoading(false)
        })
    }, 0)
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [ticker])

  return (
    <div className="screen pb-10">
      <header className="grid grid-cols-[auto_1fr_auto] items-center px-6 pt-[44px] pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="justify-self-start -ml-1 w-10 h-10 flex items-center justify-center"
        >
          <svg
            width="14"
            height="24"
            viewBox="0 0 12 24"
            fill="none"
            stroke="#191F28"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="10 4 2 12 10 20" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[12px] leading-4 text-gray-400">{displayName}</span>
          {summary && (
            <span className={`text-[14px] leading-5 font-medium tabular-nums ${rateColor(summary.changeRate)}`}>
              {formatPrice(summary.currentPriceKrw)} {formatRate(summary.changeRate)}
            </span>
          )}
          {isLoading && !summary && (
            <div className="mt-1 h-5 w-28 animate-pulse rounded bg-gray-100" aria-hidden="true" />
          )}
        </div>

        <span className="w-10" aria-hidden />
      </header>

      <div className="px-6 mt-3">
        <div className="inline-flex flex-col">
          <h2 className="text-[16px] leading-6 font-bold text-gray-900 px-1">일별 시세</h2>
          <div className="h-[2px] bg-gray-900 mt-1.5" />
        </div>
      </div>

      <div className="px-6 mt-6 animate-fade-in-up">
        {isLoading && <DailyPricesSkeleton />}
        {!isLoading && hasError && (
          <p className="text-[13px] leading-5 text-gray-500">일별 시세를 불러오지 못했습니다.</p>
        )}
        {!isLoading && !hasError && rows.length === 0 && (
          <p className="text-[13px] leading-5 text-gray-500">표시할 일별 시세가 없습니다.</p>
        )}
        {!isLoading && !hasError && rows.length > 0 && (
          <table className="w-full">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[30%]" />
              <col className="w-[20%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left text-[11px] leading-4 font-normal text-gray-400 pb-4">날짜</th>
                <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">
                  <span className="inline-flex items-center gap-1">
                    종가
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-gray-400">
                      <path d="M4 1L7 6H1L4 1Z" />
                    </svg>
                  </span>
                </th>
                <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">등락률</th>
                <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">거래량(주)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td className="text-left text-[13px] leading-5 text-gray-700 py-2.5 tabular-nums">
                    {formatDate(row.date)}
                  </td>
                  <td className="text-right text-[13px] leading-5 text-gray-900 py-2.5 tabular-nums font-normal">
                    {formatPrice(row.closePrice)}
                  </td>
                  <td className={`text-right text-[13px] leading-5 py-2.5 tabular-nums font-medium ${rateColor(row.changeRate)}`}>
                    {formatRate(row.changeRate)}
                  </td>
                  <td className="text-right text-[13px] leading-5 text-gray-700 py-2.5 tabular-nums">
                    {formatVolume(row.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
