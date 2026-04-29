export interface Stock {
  id: string
  name: string
  ticker?: string
  price: string
  changePercent: string
  isPositive: boolean
}

export const trendingStocks: Stock[] = [
  { id: '1', name: '애플', ticker: 'AAPL', price: '181,200원', changePercent: '4.2%', isPositive: false },
  { id: '2', name: 'SK 하이닉스', ticker: '000660', price: '181,200원', changePercent: '4.2%', isPositive: false },
  { id: '3', name: '현대차', ticker: '005380', price: '181,200원', changePercent: '4.2%', isPositive: false },
  { id: '4', name: '셀바스AI', ticker: '108860', price: '181,200원', changePercent: '4.2%', isPositive: false },
  { id: '5', name: '아주IB투자', ticker: '027360', price: '181,200원', changePercent: '4.2%', isPositive: false },
  { id: '6', name: 'KODEX 인버스', ticker: '114800', price: '181,200원', changePercent: '4.2%', isPositive: false },
]

export const recommendedStocks: Stock[] = [
  { id: 'r1', name: 'APPLE', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r2', name: 'NVIDIA', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r3', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r4', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r5', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r6', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r7', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
  { id: 'r8', name: '삼성전자', price: '181,200원', changePercent: '4.2%', isPositive: true },
]

export const watchlistStocks: Stock[] = [
  { id: 'w1', name: '삼성전자', price: '50,578원', changePercent: '21.4%', isPositive: true },
  { id: 'w2', name: '애플', price: '50,578원', changePercent: '21.4%', isPositive: true },
  { id: 'w3', name: '현대차', price: '50,578원', changePercent: '21.4%', isPositive: true },
  { id: 'w4', name: 'NVIDIA', price: '50,578원', changePercent: '21.4%', isPositive: true },
  { id: 'w5', name: '삼성전자', price: '50,578원', changePercent: '21.4%', isPositive: true },
  { id: 'w6', name: '삼성전자', price: '50,578원', changePercent: '21.4%', isPositive: true },
]

export const portfolioHoldings = [
  { name: '애플', shares: '5주', value: '598,420원', changePercent: '3.45%', isPositive: true },
  { name: '현대차', shares: '3주', value: '301,580원', changePercent: '3.45%', isPositive: true },
  { name: '삼성전자', shares: '3주', value: '100,000원', changePercent: '3.45%', isPositive: true },
]

export const tradeHistory = [
  { name: '애플', shares: '5주', amount: '10,000원', period: '1달 이내' },
  { name: '삼성전자', shares: '5주', amount: '10,000원', period: '1달 이내' },
  { name: '삼성전자', shares: '5주', amount: '10,000원', period: '1달 이내' },
]
