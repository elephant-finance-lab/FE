import { useEffect, useRef } from 'react'
import { createChart, AreaSeries, CandlestickSeries } from 'lightweight-charts'
import type { IChartApi, DeepPartial, ChartOptions } from 'lightweight-charts'

interface LineDataPoint {
  time: string
  value: number
}

interface CandlestickDataPoint {
  time: string
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
}

export default function StockChart({
  type = 'area',
  lineData = [],
  candlestickData = [],
  height = 280,
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
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
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
  }, [type, lineData, candlestickData, height])

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden"
      style={{ height }}
    />
  )
}
