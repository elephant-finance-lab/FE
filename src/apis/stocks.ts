import { apiRequest } from '../lib/apiClient'

export interface StockSummary {
  stockName: string
  ticker: string
  currentPriceKrw: number
  changeAmountKrw: number
  changeRate: number
  signCode: string
  direction: string
  updatedAt: string
}

export function getStockSummary(ticker: string) {
  return apiRequest<StockSummary>(`/api/stocks/${encodeURIComponent(ticker)}/summary`)
}
