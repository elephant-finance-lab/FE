import { ApiError, buildApiUrl } from '../lib/apiClient'

export type RankingType = 'volume' | 'up' | 'down' | 'market-cap' | 'contract-strength'

export interface MarketIndex {
  market: 'KOSPI' | 'KOSDAQ'
  value: number
  change: number
  changeRate: number
  timestamp: string
}

export interface MarketIndexes {
  kospi: MarketIndex | null
  kosdaq: MarketIndex | null
}

export const MARKET_INDEX_TOPIC = '/topic/market-indexes'

export interface RankingItem {
  rank: number
  tickerCode: string | null
  stockName: string | null
  price: number
  change: number
  changeRate: number
  volume: number
  metric: number
}

export interface RankingResponse {
  type: RankingType
  items: RankingItem[]
}

interface ApiFailure {
  message?: string
  code?: string
}

async function chartRequest<T>(path: string) {
  const response = await fetch(buildApiUrl(path), { credentials: 'include' })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const failure =
      body && typeof body === 'object' ? (body as ApiFailure) : null
    throw new ApiError(
      failure?.message ?? '데이터를 불러오지 못했습니다.',
      response.status,
      failure?.code,
    )
  }

  return body as T
}

export function getMarketIndexes() {
  return chartRequest<MarketIndexes>('/api/chart/market')
}

export function getMarketIndexWebSocketUrl() {
  const url = new URL(buildApiUrl('/ws'), window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export function getStockRanking(type: RankingType) {
  const query = new URLSearchParams({ type })
  return chartRequest<RankingResponse>(`/api/chart/ranking?${query.toString()}`)
}
