import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import {
  getMarketIndexes,
  getMarketIndexWebSocketUrl,
  MARKET_INDEX_TOPIC,
  type MarketIndex,
  type MarketIndexes,
} from '../apis/chart'

const MARKET_FALLBACK_REFRESH_INTERVAL_MS = 30_000

function latestIndex(current: MarketIndex | null, candidate: MarketIndex | null) {
  if (!candidate) return current
  if (!current || candidate.timestamp >= current.timestamp) return candidate
  return current
}

function mergeMarketIndexes(current: MarketIndexes | null, candidate: MarketIndexes): MarketIndexes {
  return {
    kospi: latestIndex(current?.kospi ?? null, candidate.kospi),
    kosdaq: latestIndex(current?.kosdaq ?? null, candidate.kosdaq),
  }
}

function parseMarketIndexUpdate(body: string): MarketIndex | null {
  try {
    const index = JSON.parse(body) as Partial<MarketIndex>
    if (
      (index.market !== 'KOSPI' && index.market !== 'KOSDAQ') ||
      typeof index.value !== 'number' ||
      typeof index.change !== 'number' ||
      typeof index.changeRate !== 'number' ||
      typeof index.timestamp !== 'string'
    ) {
      return null
    }
    return index as MarketIndex
  } catch {
    return null
  }
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatSignedNumber(value: number, suffix = '') {
  if (!Number.isFinite(value)) return '-'
  return `${value > 0 ? '+' : ''}${formatNumber(value)}${suffix}`
}

function movementColor(change: number) {
  if (change > 0) return 'text-toss-red'
  if (change < 0) return 'text-[#3985FF]'
  return 'text-gray-500'
}

function IndexQuote({ name, index }: { name: 'KOSPI' | 'KOSDAQ'; index: MarketIndex | null }) {
  return (
    <div className="min-w-0 flex-1">
      <span className="text-[12px] leading-[18px] text-gray-500 font-normal">{name}</span>
      {index ? (
        <>
          <p className="text-[16px] leading-6 font-semibold text-gray-900 tabular-nums">
            {formatNumber(index.value)}
          </p>
          <p className={`text-[12px] leading-5 font-medium tabular-nums ${movementColor(index.change)}`}>
            {formatSignedNumber(index.change)} ({formatSignedNumber(index.changeRate, '%')})
          </p>
        </>
      ) : (
        <p className="mt-1 text-[12px] leading-5 text-gray-400">장외 또는 지수 데이터 준비 중</p>
      )}
    </div>
  )
}

export default function TopBar() {
  const [indexes, setIndexes] = useState<MarketIndexes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const requestIdRef = useRef(0)

  const loadMarketIndexes = useCallback(async (showLoading: boolean) => {
    const requestId = ++requestIdRef.current
    if (showLoading) setIsLoading(true)

    try {
      const nextIndexes = await getMarketIndexes()
      if (requestId !== requestIdRef.current) return
      setIndexes((current) => mergeMarketIndexes(current, nextIndexes))
      setHasError(false)
    } catch {
      if (requestId !== requestIdRef.current) return
      setHasError(true)
    } finally {
      if (showLoading && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const applyMarketIndexUpdate = useCallback((index: MarketIndex) => {
    const update: MarketIndexes = {
      kospi: index.market === 'KOSPI' ? index : null,
      kosdaq: index.market === 'KOSDAQ' ? index : null,
    }
    setIndexes((current) => mergeMarketIndexes(current, update))
    setHasError(false)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadMarketIndexes(true)
    }, 0)
    const refreshTimer = window.setInterval(() => {
      void loadMarketIndexes(false)
    }, MARKET_FALLBACK_REFRESH_INTERVAL_MS)
    const client = new Client({
      brokerURL: getMarketIndexWebSocketUrl(),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      onConnect: () => {
        client.subscribe(MARKET_INDEX_TOPIC, (message) => {
          const index = parseMarketIndexUpdate(message.body)
          if (index) applyMarketIndexUpdate(index)
        })
      },
    })
    client.activate()

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(refreshTimer)
      requestIdRef.current += 1
      void client.deactivate()
    }
  }, [applyMarketIndexUpdate, loadMarketIndexes])

  return (
    <header className="px-[20px] pt-[20px] pb-[18px] bg-white">
      <div className="mb-[18px] flex items-center">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-[17px] font-semibold leading-6 tracking-[-0.01em] text-gray-900">
            코끼리자산연구소
          </span>
        </div>
      </div>

      {isLoading && !indexes && (
        <div
          className="flex items-stretch gap-5 rounded-[14px] bg-gray-50 px-4 py-3"
          aria-label="시장 지수 로딩 중"
        >
          {[0, 1].map((item) => (
            <div key={item} className="flex-1 animate-pulse">
              <div className="h-3 w-12 rounded bg-gray-200" />
              <div className="mt-2 h-5 w-20 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {hasError && !indexes && !isLoading && (
        <div className="flex items-center justify-between py-3">
          <p className="text-[13px] leading-5 text-gray-500">데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void loadMarketIndexes(true)}
            className="text-[13px] leading-5 text-gray-700 underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {indexes && (
        <div className="flex items-stretch rounded-[14px] bg-gray-50 px-4 py-3" aria-label="시장 지수">
          <IndexQuote name="KOSPI" index={indexes.kospi} />
          <div className="mx-4 border-l border-dashed border-gray-300" />
          <IndexQuote name="KOSDAQ" index={indexes.kosdaq} />
        </div>
      )}
    </header>
  )
}
