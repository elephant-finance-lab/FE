import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import StockChart from '../../components/StockChart'
import { appleLineData, appleCandlestickData, sliceDataByPeriod } from '../../data/mockChartData'

const periods = ['1일', '1주', '3달', '1년', '5년', '전체']
const detailTabs = ['차트', '종목정보']
const financialPeriods = ['분기', '반기', '연간'] as const
type FinancialPeriod = (typeof financialPeriods)[number]

interface RangeSliderProps {
  leftLabel: string
  leftValue: string
  rightLabel: string
  rightValue: string
  position: number
}

function RangeSlider({ leftLabel, leftValue, rightLabel, rightValue, position }: RangeSliderProps) {
  const clamped = Math.min(100, Math.max(0, position))
  return (
    <div>
      <div className="relative h-[6px] bg-[#E5E5E5] rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-[#9E9E9E] rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          style={{ left: `calc(${clamped}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between mt-3">
        <div className="flex flex-col">
          <span className="text-[11px] leading-4 text-gray-400">{leftLabel}</span>
          <span className="text-[12px] leading-5 font-medium text-gray-700 tabular-nums">{leftValue}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[11px] leading-4 text-gray-400">{rightLabel}</span>
          <span className="text-[12px] leading-5 font-medium text-gray-700 tabular-nums">{rightValue}</span>
        </div>
      </div>
    </div>
  )
}

interface FinancialBar {
  label: string
  revenue: number
  operating: number
  net: number
}

const financialDataByPeriod: Record<FinancialPeriod, FinancialBar[]> = {
  분기: [
    { label: '24년 3월', revenue: 78, operating: 56, net: 60 },
    { label: '24년 6월', revenue: 84, operating: 60, net: 65 },
    { label: '24년 9월', revenue: 86, operating: 62, net: 68 },
    { label: '24년 12월', revenue: 92, operating: 68, net: 74 },
    { label: '25년 3월', revenue: 89, operating: 65, net: 71 },
  ],
  반기: [
    { label: '23년 상', revenue: 72, operating: 50, net: 55 },
    { label: '23년 하', revenue: 78, operating: 55, net: 60 },
    { label: '24년 상', revenue: 82, operating: 58, net: 63 },
    { label: '24년 하', revenue: 88, operating: 64, net: 70 },
    { label: '25년 상', revenue: 90, operating: 66, net: 72 },
  ],
  연간: [
    { label: '21년', revenue: 60, operating: 42, net: 46 },
    { label: '22년', revenue: 70, operating: 50, net: 54 },
    { label: '23년', revenue: 76, operating: 56, net: 60 },
    { label: '24년', revenue: 86, operating: 62, net: 68 },
    { label: '25년', revenue: 94, operating: 70, net: 76 },
  ],
}

function FinancialBarChart({ period }: { period: FinancialPeriod }) {
  const data = financialDataByPeriod[period]
  return (
    <div className="mt-6">
      <div className="relative pl-1">
        <div className="flex items-end justify-between h-[150px]">
          {data.map((q, i) => (
            <div key={i} className="flex items-end gap-[3px] h-full justify-center">
              <div
                className="w-[10px] bg-[#D9D9D9] rounded-sm"
                style={{ height: `${q.revenue}%` }}
              />
              <div
                className="w-[10px] bg-[#A3D977] rounded-sm"
                style={{ height: `${q.operating}%` }}
              />
              <div
                className="w-[10px] bg-[#F4C84A] rounded-sm"
                style={{ height: `${q.net}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {data.map((q, i) => (
            <span key={i} className="text-[10px] leading-4 text-gray-400 text-center">
              {q.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-x-3">
        {[
          { color: '#D9D9D9', label: '매출', value: '32조원' },
          { color: '#A3D977', label: '영업이익', value: '32조원' },
          { color: '#F4C84A', label: '순이익', value: '32조원' },
        ].map((legend) => (
          <div key={legend.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: legend.color }}
              />
              <span className="text-[11px] leading-4 text-gray-500">{legend.label}</span>
            </div>
            <span className="text-[14px] leading-5 font-semibold text-gray-900 tabular-nums">
              {legend.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StockDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [activePeriod, setActivePeriod] = useState('1년')
  const [activeTab, setActiveTab] = useState('차트')
  const [chartType, setChartType] = useState<'area' | 'candlestick'>('area')
  const [financialPeriod, setFinancialPeriod] = useState<FinancialPeriod>('분기')
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false)
  const periodMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!periodMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(e.target as Node)) {
        setPeriodMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [periodMenuOpen])

  const filteredLineData = useMemo(() => sliceDataByPeriod(appleLineData, activePeriod), [activePeriod])
  const filteredCandleData = useMemo(() => sliceDataByPeriod(appleCandlestickData, activePeriod), [activePeriod])

  const prices = filteredLineData.map((d) => d.value)
  const highPrice = prices.length > 0 ? Math.max(...prices) : 0
  const lowPrice = prices.length > 0 ? Math.min(...prices) : 0

  return (
    <div className="screen pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-px pt-4">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-semibold leading-8 text-gray-900">애플</h1>
          <div className="flex items-center gap-1 px-2.5 h-[22px] rounded-full bg-gray-100 text-gray-500">
            <span className="text-[11px] font-medium">APPLE</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-[28px] font-semibold leading-[1.25] text-gray-900 tabular-nums">568,632원</span>
          <span className="text-[15px] leading-6 text-gray-400 tabular-nums">$382.66</span>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[13px] leading-5 text-gray-500">지난 정규장보다</span>
          <span className="text-[14px] leading-5 font-medium text-[#3985FF] tabular-nums">15,038원 (2.5%)</span>
        </div>
      </div>

      <div className="screen-px mt-6">
        <div className="flex border-b border-gray-100">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-[15px] font-normal leading-6 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === '차트' && (
        <div className="animate-fade-in-up">
          <div className="screen-px mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setChartType('area')}
                className={`text-[13px] font-medium px-3 py-1 rounded-lg transition-colors ${chartType === 'area' ? 'bg-toss-blue text-white' : 'text-gray-500'}`}
              >
                라인
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={`text-[13px] font-medium px-3 py-1 rounded-lg transition-colors ${chartType === 'candlestick' ? 'bg-toss-blue text-white' : 'text-gray-500'}`}
              >
                캔들
              </button>
            </div>
            <div className="flex items-center gap-3 text-[12px] tabular-nums">
              <span className="text-toss-red font-medium">최고 ${highPrice.toFixed(2)}</span>
              <span className="text-toss-blue font-medium">최저 ${lowPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="screen-px mt-3">
            <StockChart
              type={chartType}
              lineData={chartType === 'area' ? filteredLineData : undefined}
              candlestickData={chartType === 'candlestick' ? filteredCandleData : undefined}
              height={280}
            />
          </div>

          <div className="screen-px mt-4">
            <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePeriod(p)}
                  className={`flex-1 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    activePeriod === p
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="screen-px mt-5 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/stock/${id ?? '1'}/daily-prices`)}
              className="flex items-center gap-2 text-[14px] text-gray-600 font-medium"
            >
              일별 시세 보기
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className="mt-5 bg-[#F5F5F5]">
            {[
              {
                title: 'AI 추천 적중률',
                content:
                  '최근 추천 흐름과 실제 가격 변동을 비교해 산출한 예측 신뢰도입니다. 현재 종목은 단기 변동성보다 중장기 추세 안정성이 더 높게 평가됩니다.',
              },
              {
                title: '매매 이유 기록',
                content:
                  '안정적인 매출 흐름과 서비스 부문 성장세, 낮은 변동성을 기준으로 추천되었습니다. 목표 수익률과 손절 기준을 함께 관리해보세요.',
              },
              {
                title: '향후 전략 제안',
                content:
                  '단기 급등 구간에서는 분할 매수를 고려하고, 주요 실적 발표 전후로 변동성이 커질 수 있으니 보유 비중을 점검하는 것을 권장합니다.',
              },
            ].map((section) => (
              <section key={section.title} className="bg-white px-6 py-6 border-b-[10px] border-[#F5F5F5]">
                <h3 className="text-[15px] font-semibold leading-6 text-gray-900">{section.title}</h3>
                <p className="mt-4 text-[12px] leading-[1.65] text-gray-700">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      )}

      {activeTab === '종목정보' && (
        <div className="bg-[#F5F5F5] mt-3 animate-fade-in-up">
          <div className="bg-white px-6 pt-6 pb-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[18px] font-bold leading-7 text-gray-900">시세</h3>
              <span className="text-[11px] leading-4 text-gray-400">3월27일 기준</span>
            </div>

            <div className="mt-7">
              <RangeSlider
                leftLabel="1일 최저가"
                leftValue="880,000원"
                rightLabel="1일 최고가"
                rightValue="880,000원"
                position={50}
              />
            </div>

            <div className="mt-6">
              <RangeSlider
                leftLabel="1년 최저가"
                leftValue="880,000원"
                rightLabel="1년 최고가"
                rightValue="880,000원"
                position={50}
              />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-y-3 gap-x-4">
              {[
                { label: '시작가', value: '999,000원' },
                { label: '거래량', value: '999,000주' },
                { label: '종가', value: '999,000원' },
                { label: '거래대금', value: '6.9조원' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[12px] leading-5 text-gray-400">{stat.label}</span>
                  <span className="text-[13px] leading-5 font-medium text-gray-900 tabular-nums">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 pt-5 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                onClick={() => navigate(`/stock/${id ?? '1'}/daily-prices`)}
                className="flex items-center gap-1.5 text-[13px] leading-5 font-normal text-gray-500"
              >
                일별 시세 보기
                <svg width="6" height="10" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />

          <div className="bg-white px-6 pt-6 pb-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[18px] font-bold leading-7 text-gray-900">재무</h3>
              <div ref={periodMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPeriodMenuOpen((o) => !o)}
                  className="flex items-center gap-1 text-[12px] leading-5 text-gray-400 active:text-gray-600 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={periodMenuOpen}
                >
                  {financialPeriod}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${periodMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {periodMenuOpen && (
                  <ul
                    role="listbox"
                    className="absolute right-0 top-full mt-2 min-w-[80px] bg-white rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-gray-100 py-1 z-10 animate-fade-in"
                  >
                    {financialPeriods.map((p) => (
                      <li key={p} role="option" aria-selected={financialPeriod === p}>
                        <button
                          type="button"
                          onClick={() => {
                            setFinancialPeriod(p)
                            setPeriodMenuOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-[12px] leading-5 transition-colors ${
                            financialPeriod === p
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-500'
                          } hover:bg-gray-50`}
                        >
                          {p}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <FinancialBarChart period={financialPeriod} />

            <div className="mt-7 pt-5 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                onClick={() => navigate(`/stock/${id ?? '1'}/financials`)}
                className="flex items-center gap-1.5 text-[13px] leading-5 font-normal text-gray-500"
              >
                재무제표 보기
                <svg width="6" height="10" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />
        </div>
      )}
    </div>
  )
}
