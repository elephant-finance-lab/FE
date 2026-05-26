import { apiRequest, buildApiUrl } from '../lib/apiClient'

export type StockChartRange = '1D' | '1W' | '3M' | '1Y' | '5Y' | 'ALL'
export type StockChartType = 'LINE' | 'CANDLE'
export type StockFinancialPeriod = 'QUARTER' | 'YEAR'
export type StockFinancialStatement = 'INCOME' | 'BALANCE' | 'RATIO'

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

export interface StockChartDataPoint {
  time: string
  price: number | null
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

export interface StockChart {
  ticker: string
  range: StockChartRange
  type: StockChartType
  interval: 'MINUTE' | 'DAY' | 'MONTH' | 'YEAR'
  currency: string
  data: StockChartDataPoint[] | null
}

export interface StockChartUpdate {
  ticker: string
  range: StockChartRange
  type: StockChartType
  interval: StockChart['interval']
  currency: string
  point: StockChartDataPoint
}

export interface StockInfoPrice {
  dayLowPriceKrw: number | null
  dayHighPriceKrw: number | null
  week52LowPriceKrw: number | null
  week52HighPriceKrw: number | null
  openPriceKrw: number | null
  currentPriceKrw: number | null
  volume: number | null
  tradingValueKrw: number | null
  asOfDate: string | null
}

export interface StockFinancialRow {
  label: string
  values: string[] | null
}

export interface StockFinancialSummary {
  period: StockFinancialPeriod
  unit: string
  columns: string[] | null
  rows: StockFinancialRow[] | null
}

export interface StockInfo {
  ticker: string
  nameKor: string
  price: StockInfoPrice
  financialSummary: StockFinancialSummary
}

export interface StockFinancial extends StockFinancialSummary {
  ticker: string
  nameKor: string
  statement: StockFinancialStatement
}

export interface StockDailyPriceItem {
  date: string
  closePrice: number | null
  changeRate: number | null
  volume: number | null
  tradingValue: number | null
}

export interface StockDailyPrices {
  ticker: string
  items: StockDailyPriceItem[] | null
}

export function getStockSummary(ticker: string) {
  return apiRequest<StockSummary>(`/api/stocks/${encodeURIComponent(ticker)}/summary`)
}

export function getStockChart(ticker: string, range: StockChartRange, type: StockChartType) {
  const query = new URLSearchParams({ range, type })
  return apiRequest<StockChart>(
    `/api/stocks/${encodeURIComponent(ticker)}/chart?${query.toString()}`,
  )
}

export function getStockInfo(ticker: string, period: StockFinancialPeriod) {
  const query = new URLSearchParams({ period })
  return apiRequest<StockInfo>(
    `/api/stocks/${encodeURIComponent(ticker)}/info?${query.toString()}`,
  )
}

export function getStockFinancial(
  ticker: string,
  statement: StockFinancialStatement,
  period: StockFinancialPeriod,
) {
  const query = new URLSearchParams({ statement, period })
  return apiRequest<StockFinancial>(
    `/api/stocks/${encodeURIComponent(ticker)}/financial?${query.toString()}`,
  )
}

export function getStockDailyPrices(ticker: string) {
  return apiRequest<StockDailyPrices>(`/api/stocks/${encodeURIComponent(ticker)}/daily`)
}

export function getStockWebSocketUrl() {
  const url = new URL(buildApiUrl('/ws'), window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export function getStockPriceTopic(ticker: string) {
  return `/topic/stocks/${ticker.trim().toUpperCase()}/price`
}

export function getStockChartTopic(ticker: string) {
  return `/topic/stocks/${ticker.trim().toUpperCase()}/chart`
}
