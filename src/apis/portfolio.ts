import { apiRequest } from '../lib/apiClient'

export type TradeSide = 'BUY' | 'SELL'
export type TradePeriod = '1W' | '1M' | '3M'

export interface PortfolioHolding {
  tickerCode?: string
  companyName?: string
  quantity?: number
  evalAmount?: number
  profitRate?: number
  weight?: number
  stockCode?: string
  stockName?: string
  averagePrice?: number
  currentPrice?: number
  evaluationAmount?: number
  profitLossAmount?: number
  profitLossRate?: number
  weightRate?: number
}

export interface PortfolioSummary {
  totalAsset?: number
  totalProfit?: number
  totalProfitRate?: number
  positions?: PortfolioHolding[]
  totalAssetAmount?: number
  stockEvaluationAmount?: number
  cashAmount?: number
  totalProfitLossAmount?: number
  totalProfitLossRate?: number
  holdings?: PortfolioHolding[]
}

export interface PortfolioTrade {
  tradeId?: number | null
  tickerCode?: string
  companyName?: string
  type?: TradeSide
  quantity?: number
  price?: number
  totalAmount?: number
  tradedAt?: string
  tradeDate?: string
  side?: TradeSide
  stockCode?: string
  stockName?: string
  amount?: number
}

export interface PortfolioTradePage {
  page: number
  size: number
  hasNext: boolean
  trades?: PortfolioTrade[]
  items?: PortfolioTrade[]
}

export function getPortfolioSummary() {
  return apiRequest<PortfolioSummary>('/api/portfolio/summary')
}

export function getPortfolioTrades(side: TradeSide, period: TradePeriod, size = 50) {
  const params = new URLSearchParams({
    side,
    period,
    page: '0',
    size: String(size),
  })
  return apiRequest<PortfolioTradePage>(`/api/portfolio/trades?${params.toString()}`)
}
