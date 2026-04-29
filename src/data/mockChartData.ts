function generateLineData(days: number, basePrice: number, volatility: number) {
  const data = []
  let price = basePrice
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    price += (Math.random() - 0.48) * volatility
    price = Math.max(price * 0.7, price)
    data.push({
      time: `${yyyy}-${mm}-${dd}`,
      value: Math.round(price * 100) / 100,
    })
  }
  return data
}

function generateCandlestickData(days: number, basePrice: number, volatility: number) {
  const data = []
  let price = basePrice
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')

    const open = price
    const change = (Math.random() - 0.48) * volatility
    const close = open + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    data.push({
      time: `${yyyy}-${mm}-${dd}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    })
    price = close
  }
  return data
}

export const appleLineData = generateLineData(365, 180, 3)
export const appleCandlestickData = generateCandlestickData(365, 180, 3)
export const samsungLineData = generateLineData(365, 72000, 800)
export const samsungCandlestickData = generateCandlestickData(365, 72000, 800)
export const nvidiaLineData = generateLineData(365, 130, 5)
export const nvidiaCandlestickData = generateCandlestickData(365, 130, 5)

export function sliceDataByPeriod<T extends { time: string }>(data: T[], period: string): T[] {
  const now = new Date()
  let daysBack = 365
  switch (period) {
    case '1일': daysBack = 1; break
    case '1주': daysBack = 7; break
    case '3달': daysBack = 90; break
    case '1년': daysBack = 365; break
    case '5년': daysBack = 365 * 5; break
    case '전체': return data
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return data.filter((d) => d.time >= cutoffStr)
}
