import { useEffect, useRef } from 'react'
import { createChart, AreaSeries, CandlestickSeries, TickMarkType } from 'lightweight-charts'
import type {
  IChartApi,
  DeepPartial,
  ChartOptions,
  Time,
  AutoscaleInfoProvider,
  BusinessDay,
} from 'lightweight-charts'

interface LineDataPoint {
  time: Time
  value: number
}

interface CandlestickDataPoint {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

interface StockChartProps {
  type?: 'area' | 'candlestick'
  lineData?: LineDataPoint[]
  candlestickData?: CandlestickDataPoint[]
  height?: number
  showTime?: boolean
}

const softAutoscaleInfoProvider: AutoscaleInfoProvider = (original) => {
  const info = original()
  const priceRange = info?.priceRange
  if (!priceRange) return info

  const minValue = priceRange.minValue
  const maxValue = priceRange.maxValue
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return info

  const midpoint = (minValue + maxValue) / 2
  const span = Math.max(maxValue - minValue, Math.abs(midpoint) * 0.015, 1)
  const padding = span * 0.45

  return {
    ...info,
    priceRange: {
      minValue: Math.max(0, minValue - padding),
      maxValue: maxValue + padding,
    },
    margins: {
      above: Math.max(info.margins?.above ?? 0, 18),
      below: Math.max(info.margins?.below ?? 0, 18),
    },
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

const koreaDateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function businessDayFromTime(time: Time): BusinessDay | null {
  if (typeof time === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(time)
    if (!match) return null
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    }
  }

  if (typeof time === 'object' && 'year' in time && 'month' in time && 'day' in time) {
    return time
  }

  return null
}

function datePartsFromTimestamp(timestamp: number) {
  const parts = koreaDateTimeFormatter.formatToParts(new Date(timestamp * 1000))

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  }
}

function formatCrosshairTime(time: Time, showTime: boolean) {
  const businessDay = businessDayFromTime(time)
  if (businessDay) {
    return `${businessDay.year}.${pad(businessDay.month)}.${pad(businessDay.day)}`
  }

  if (typeof time === 'number') {
    const parts = datePartsFromTimestamp(time)
    const date = `${parts.year}.${pad(parts.month)}.${pad(parts.day)}`
    return showTime ? `${date} ${pad(parts.hour)}:${pad(parts.minute)}` : date
  }

  return String(time)
}

function formatTickMark(time: Time, tickMarkType: TickMarkType, showTime: boolean) {
  if (typeof time === 'number') {
    const parts = datePartsFromTimestamp(time)
    if (showTime || tickMarkType === TickMarkType.Time || tickMarkType === TickMarkType.TimeWithSeconds) {
      return `${pad(parts.hour)}:${pad(parts.minute)}`
    }
    if (tickMarkType === TickMarkType.Year) return `${parts.year}년`
    if (tickMarkType === TickMarkType.Month) return `${parts.year}.${pad(parts.month)}`
    return `${pad(parts.month)}.${pad(parts.day)}`
  }

  const businessDay = businessDayFromTime(time)
  if (!businessDay) return String(time)
  if (tickMarkType === TickMarkType.Year) return `${businessDay.year}년`
  if (tickMarkType === TickMarkType.Month) return `${businessDay.year}.${pad(businessDay.month)}`
  return `${pad(businessDay.month)}.${pad(businessDay.day)}`
}

export default function StockChart({
  type = 'area',
  lineData = [],
  candlestickData = [],
  height = 280,
  showTime = false,
}: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { color: '#FAFAFA' },
        textColor: '#9E9E9E',
        fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.03)' },
        horzLines: { color: 'rgba(0,0,0,0.03)' },
      },
      crosshair: {
        vertLine: { color: '#3182F6', width: 1, style: 3, labelBackgroundColor: '#3182F6' },
        horzLine: { color: '#3182F6', width: 1, style: 3, labelBackgroundColor: '#3182F6' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.2,
          bottom: 0.18,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: showTime,
        secondsVisible: false,
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
          formatTickMark(time, tickMarkType, showTime),
      },
      localization: {
        locale: 'ko-KR',
        timeFormatter: (time: Time) => formatCrosshairTime(time, showTime),
        dateFormat: 'yyyy.MM.dd',
        priceFormatter: (price: number) =>
          price.toLocaleString('ko-KR', { maximumFractionDigits: 0 }),
      },
      handleScroll: { vertTouchDrag: false },
    }

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width: containerRef.current.clientWidth,
      height,
    })

    if (type === 'area' && lineData.length > 0) {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#3182F6',
        topColor: 'rgba(49, 130, 246, 0.3)',
        bottomColor: 'rgba(49, 130, 246, 0.02)',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
        autoscaleInfoProvider: softAutoscaleInfoProvider,
      })
      series.setData(lineData)
    } else if (type === 'candlestick' && candlestickData.length > 0) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#FF3B30',
        downColor: '#3182F6',
        borderUpColor: '#FF3B30',
        borderDownColor: '#3182F6',
        wickUpColor: '#FF3B30',
        wickDownColor: '#3182F6',
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
        autoscaleInfoProvider: softAutoscaleInfoProvider,
      })
      series.setData(candlestickData)
    }

    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [type, lineData, candlestickData, height, showTime])

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden"
      style={{ height }}
    />
  )
}
