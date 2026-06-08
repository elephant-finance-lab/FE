import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPortfolioSummary,
  getPortfolioTrades,
  type PortfolioHolding,
  type PortfolioSummary,
  type PortfolioTrade,
  type TradePeriod,
  type TradeSide,
} from '../../apis/portfolio'

const mainTabs = ['총 투자 자산', '내 거래 기록'] as const
const tradeTabs: { label: string; value: TradeSide }[] = [
  { label: '매수', value: 'BUY' },
  { label: '매도', value: 'SELL' },
]
const periodOptions: { label: string; value: TradePeriod }[] = [
  { label: '1주 이내', value: '1W' },
  { label: '1달 이내', value: '1M' },
  { label: '3달 이내', value: '3M' },
]
const allocationColors = ['#1F6FEB', '#55A6FF', '#29B6A8', '#F5B84B', '#8E7CF6']

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} aria-hidden="true" />
}

function validNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function numberOrZero(value: number | null | undefined) {
  return validNumber(value) ? value : 0
}

function formatWon(value: number | null | undefined) {
  return `${Math.round(numberOrZero(value)).toLocaleString('ko-KR')}원`
}

function formatPercent(value: number | null | undefined) {
  const numericValue = numberOrZero(value)
  return `${numericValue > 0 ? '+' : ''}${numericValue.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })}%`
}

function formatQuantity(value: number | null | undefined) {
  return `${Math.round(numberOrZero(value)).toLocaleString('ko-KR')}주`
}

function holdingCode(holding: PortfolioHolding) {
  return holding.stockCode ?? holding.tickerCode ?? ''
}

function holdingName(holding: PortfolioHolding) {
  return holding.stockName ?? holding.companyName ?? holdingCode(holding) ?? '-'
}

function holdingEvaluationAmount(holding: PortfolioHolding) {
  return numberOrZero(holding.evaluationAmount ?? holding.evalAmount)
}

function holdingProfitRate(holding: PortfolioHolding) {
  return numberOrZero(holding.profitLossRate ?? holding.profitRate)
}

function holdingWeight(holding: PortfolioHolding, stockEvaluationAmount: number) {
  const fromServer = holding.weightRate ?? holding.weight
  if (validNumber(fromServer) && fromServer > 0) return fromServer
  const evaluationAmount = holdingEvaluationAmount(holding)
  return stockEvaluationAmount > 0 ? (evaluationAmount / stockEvaluationAmount) * 100 : 0
}

function tradeName(trade: PortfolioTrade) {
  return trade.stockName ?? trade.companyName ?? trade.stockCode ?? trade.tickerCode ?? '-'
}

function tradeQuantity(trade: PortfolioTrade) {
  return numberOrZero(trade.quantity)
}

function tradeAmount(trade: PortfolioTrade) {
  return numberOrZero(trade.amount ?? trade.totalAmount)
}

function tradePrice(trade: PortfolioTrade) {
  return numberOrZero(trade.price)
}

function tradeDate(trade: PortfolioTrade) {
  if (trade.tradeDate) return trade.tradeDate
  return trade.tradedAt?.slice(0, 10) ?? ''
}

function profitColor(value: number) {
  if (value > 0) return 'text-toss-red'
  if (value < 0) return 'text-toss-blue'
  return 'text-gray-500'
}

function SummarySkeleton() {
  return (
    <>
      <div className="px-6 pt-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-3 h-[18px] w-full rounded-[5px]" />
      </div>
      <div className="px-6 mt-4 flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center justify-between py-2.5">
            <div className="flex items-start gap-2.5">
              <Skeleton className="mt-1 h-8 w-[3px]" />
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-1 h-4 w-12" />
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1 h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function TradesSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-[33px] w-[33px] rounded-full" />
            <div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-1 h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const [activeMainTab, setActiveMainTab] = useState<(typeof mainTabs)[number]>(mainTabs[0])
  const [activeTradeTab, setActiveTradeTab] = useState<TradeSide>('BUY')
  const [selectedPeriod, setSelectedPeriod] = useState<TradePeriod>('1M')
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')
  const [showAllHoldings, setShowAllHoldings] = useState(false)
  const [trades, setTrades] = useState<PortfolioTrade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [tradesError, setTradesError] = useState('')
  const [showAllTrades, setShowAllTrades] = useState(false)

  useEffect(() => {
    let ignored = false
    const timer = window.setTimeout(() => {
      setSummaryLoading(true)
      setSummaryError('')

      void getPortfolioSummary()
        .then((result) => {
          if (!ignored) setSummary(result)
        })
        .catch(() => {
          if (!ignored) {
            setSummary(null)
            setSummaryError('보유 종목을 불러오지 못했습니다.')
          }
        })
        .finally(() => {
          if (!ignored) setSummaryLoading(false)
        })
    }, 0)

    return () => {
      ignored = true
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (activeMainTab !== '내 거래 기록') return

    let ignored = false
    const timer = window.setTimeout(() => {
      setTradesLoading(true)
      setTradesError('')
      setShowAllTrades(false)

      void getPortfolioTrades(activeTradeTab, selectedPeriod)
        .then((result) => {
          if (!ignored) setTrades(result.items ?? result.trades ?? [])
        })
        .catch(() => {
          if (!ignored) {
            setTrades([])
            setTradesError('거래 기록을 불러오지 못했습니다.')
          }
        })
        .finally(() => {
          if (!ignored) setTradesLoading(false)
        })
    }, 0)

    return () => {
      ignored = true
      window.clearTimeout(timer)
    }
  }, [activeMainTab, activeTradeTab, selectedPeriod])

  const holdings = useMemo(
    () =>
      [...(summary?.holdings ?? summary?.positions ?? [])].sort(
        (a, b) => holdingEvaluationAmount(b) - holdingEvaluationAmount(a),
      ),
    [summary],
  )
  const stockEvaluationAmount = numberOrZero(
    summary?.stockEvaluationAmount ?? holdings.reduce((total, holding) => total + holdingEvaluationAmount(holding), 0),
  )
  const visibleHoldings = showAllHoldings ? holdings : holdings.slice(0, 3)
  const visibleTrades = showAllTrades ? trades : trades.slice(0, 8)
  const totalAssetAmount = numberOrZero(summary?.totalAssetAmount ?? summary?.totalAsset)

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 pb-2 border-b border-gray-100">
        <div className="flex items-start">
          <div className="flex gap-4">
            {mainTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMainTab(tab)}
                className={`pb-3 text-[15px] font-medium leading-6 border-b-2 transition-colors ${
                  activeMainTab === tab ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeMainTab === '총 투자 자산' && (
        <section className="animate-fade-in-up">
          {summaryLoading && <SummarySkeleton />}

          {!summaryLoading && summaryError && (
            <p className="px-6 pt-6 text-[14px] leading-5 text-toss-red">{summaryError}</p>
          )}

          {!summaryLoading && !summaryError && (
            <>
              <div className="px-6 pt-6">
                <p className="text-[24px] font-semibold leading-8 text-gray-900 tabular-nums">
                  {formatWon(totalAssetAmount)}
                </p>
                <div className="mt-3 flex h-[18px] overflow-hidden rounded-[5px] bg-gray-100">
                  {holdings.length === 0 && <div className="h-full w-full bg-gray-100" />}
                  {holdings.map((holding, idx) => (
                    <div
                      key={`${holdingCode(holding)}-${idx}`}
                      className={idx > 0 ? 'border-l border-white' : ''}
                      style={{
                        width: `${Math.max(holdingWeight(holding, stockEvaluationAmount), 2)}%`,
                        backgroundColor: allocationColors[idx % allocationColors.length],
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="px-6 mt-4 flex flex-col">
                {visibleHoldings.map((holding, idx) => {
                  const code = holdingCode(holding)
                  const profitRate = holdingProfitRate(holding)
                  return (
                    <button
                      key={`${code}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (code) navigate(`/stock/${encodeURIComponent(code)}`, { state: { stockName: holdingName(holding) } })
                      }}
                      className="flex items-center justify-between py-2.5 text-left active:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-1 h-8 w-[3px] rounded-full"
                          style={{ backgroundColor: allocationColors[idx % allocationColors.length] }}
                        />
                        <div>
                          <p className="text-[15px] font-semibold leading-5 text-gray-900">{holdingName(holding)}</p>
                          <p className="text-[12px] leading-4 text-gray-500 mt-0.5">
                            {formatQuantity(holding.quantity)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-semibold leading-5 text-gray-900 tabular-nums">
                          {formatWon(holdingEvaluationAmount(holding))}
                        </p>
                        <p className={`text-[11px] font-medium leading-4 tabular-nums ${profitColor(profitRate)}`}>
                          {formatPercent(profitRate)}
                        </p>
                      </div>
                    </button>
                  )
                })}
                {holdings.length === 0 && (
                  <p className="py-8 text-center text-[14px] leading-5 text-gray-500">보유 종목이 없습니다.</p>
                )}
              </div>

              {holdings.length > 3 && (
                <div className="mx-6 mt-3 border-t border-gray-200 py-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllHoldings((previous) => !previous)}
                    className="px-3 py-1.5 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
                  >
                    {showAllHoldings ? '접기' : '더 보기'}
                  </button>
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/mypage/account')}
                  className="w-full border-y border-gray-100 px-6 py-5 flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    </span>
                    <span className="text-[15px] font-medium leading-6 text-gray-900">연결된 계좌 보기</span>
                  </div>
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {activeMainTab === '내 거래 기록' && (
        <section className="px-6 animate-fade-in-up">
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              {tradeTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTradeTab(tab.value)}
                  className={`chip ${activeTradeTab === tab.value ? 'chip-active' : 'chip-inactive'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value as TradePeriod)}
              className="h-[30px] rounded-[7px] border border-gray-200 bg-white px-2 text-[13px] leading-5 text-gray-500"
              aria-label="거래 기간"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {tradesLoading && <TradesSkeleton />}
          {!tradesLoading && tradesError && (
            <p className="py-8 text-center text-[14px] leading-5 text-toss-red">{tradesError}</p>
          )}
          {!tradesLoading && !tradesError && trades.length === 0 && (
            <p className="py-8 text-center text-[14px] leading-5 text-gray-500">거래 기록이 없습니다.</p>
          )}
          {!tradesLoading && !tradesError && trades.length > 0 && (
            <>
              <div className="mt-5 flex flex-col gap-4">
                {visibleTrades.map((trade, idx) => {
                  const side = trade.side ?? trade.type ?? activeTradeTab
                  const amount = tradeAmount(trade)
                  const price = tradePrice(trade)
                  return (
                    <div key={`${trade.stockCode ?? trade.tickerCode ?? tradeName(trade)}-${idx}`} className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={`w-[33px] h-[33px] rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold ${
                          side === 'BUY' ? 'bg-red-50 text-toss-red' : 'bg-blue-50 text-toss-blue'
                        }`}>
                          {side === 'BUY' ? '매수' : '매도'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold leading-5 text-gray-900 truncate">{tradeName(trade)}</p>
                          <p className="text-[12px] leading-4 text-gray-500 mt-0.5">
                            {formatQuantity(tradeQuantity(trade))} · {tradeDate(trade)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-semibold leading-6 text-gray-900 tabular-nums">
                          {formatWon(amount || price)}
                        </p>
                        {amount > 0 && price > 0 && (
                          <p className="text-[11px] leading-4 text-gray-400 tabular-nums">{formatWon(price)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {trades.length > 8 && (
                <div className="mt-8 border-t border-gray-200 py-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllTrades((previous) => !previous)}
                    className="px-3 py-1.5 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
                  >
                    {showAllTrades ? '접기' : '더 보기'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
