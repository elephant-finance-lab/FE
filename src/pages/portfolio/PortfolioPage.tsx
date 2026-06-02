import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portfolioHoldings, tradeHistory } from '../../data/mockStocks'

const mainTabs = ['총 투자 자산', '내 거래 기록'] as const
const tradeTabs = ['매수', '매도'] as const
const allocationColors = ['bg-[#1F6FEB]', 'bg-[#6BA8FF]', 'bg-[#DCEBFF]']
const allocationWidths = ['62%', '30%', '8%']
const PAGE_SIZE = 3

function formatSignedPercent(changePercent: string, isPositive: boolean) {
  const normalizedPercent = changePercent.trim().replace(/^[+-]/, '')
  if (!normalizedPercent) return ''
  return `${isPositive ? '+' : '-'}${normalizedPercent}`
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const [activeMainTab, setActiveMainTab] = useState<(typeof mainTabs)[number]>(mainTabs[0])
  const [activeTradeTab, setActiveTradeTab] = useState<(typeof tradeTabs)[number]>(tradeTabs[0])
  const [visibleHoldingsCount, setVisibleHoldingsCount] = useState(PAGE_SIZE)
  const [visibleTradeHistoryCount, setVisibleTradeHistoryCount] = useState(PAGE_SIZE)
  const visibleHoldings = portfolioHoldings.slice(0, visibleHoldingsCount)
  const visibleTradeHistory = tradeHistory.slice(0, visibleTradeHistoryCount)
  const hasMoreHoldings = visibleHoldingsCount < portfolioHoldings.length
  const hasMoreTradeHistory = visibleTradeHistoryCount < tradeHistory.length

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 pb-2 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {mainTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                className={`pb-3 text-[15px] font-medium leading-6 border-b-2 transition-colors ${
                  activeMainTab === tab ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/notification')}
            className="-mt-1 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 active:bg-gray-50 transition-colors"
            aria-label="알림"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {activeMainTab === '총 투자 자산' && (
        <section className="animate-fade-in-up">
          <div className="px-6 pt-6">
            <p className="text-[24px] font-semibold leading-8 text-gray-900 tabular-nums">1,000,000원</p>
            <div className="mt-3 flex h-[18px] overflow-hidden rounded-[5px] bg-gray-100">
              {allocationWidths.map((width, idx) => (
                <div
                  key={idx}
                  className={`${allocationColors[idx]} ${idx > 0 ? 'border-l border-white' : ''}`}
                  style={{ width }}
                />
              ))}
            </div>
          </div>

          <div className="px-6 mt-4 flex flex-col">
            {visibleHoldings.map((h, idx) => (
              <div
                key={`${h.name}-${idx}`}
                onClick={() => navigate(`/stock/${idx}`)}
                className="flex items-center justify-between py-2.5 cursor-pointer active:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1 h-8 w-[3px] rounded-full ${allocationColors[idx] ?? 'bg-gray-300'}`} />
                  <div>
                    <p className="text-[15px] font-semibold leading-5 text-gray-900">{h.name}</p>
                    <p className="text-[12px] leading-4 text-gray-500 mt-0.5">{h.shares}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold leading-5 text-gray-900 tabular-nums">{h.value}</p>
                  <p
                    className={`text-[11px] font-medium leading-4 tabular-nums ${
                      h.isPositive ? 'text-toss-red' : 'text-toss-blue'
                    }`}
                  >
                    {formatSignedPercent(h.changePercent, h.isPositive)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hasMoreHoldings && (
            <div className="mx-6 mt-3 border-t border-gray-200 py-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleHoldingsCount((count) => Math.min(count + PAGE_SIZE, portfolioHoldings.length))}
                className="px-3 py-1.5 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
              >
                더 보기
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
        </section>
      )}

      {activeMainTab === '내 거래 기록' && (
        <section className="px-6 animate-fade-in-up">
          <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {tradeTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTradeTab(tab)}
                className={`chip ${activeTradeTab === tab ? 'chip-active' : 'chip-inactive'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-[13px] leading-5 text-gray-400">1달 이내</span>
        </div>

          <div className="mt-5 flex flex-col gap-4">
            {visibleTradeHistory.map((t, idx) => (
              <div key={`${t.name}-${idx}`} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[33px] h-[33px] rounded-full bg-[#D9D9D9] shrink-0" />
                  <div>
                    <p className="text-[15px] font-semibold leading-5 text-gray-900">{t.name}</p>
                    <p className="text-[12px] leading-4 text-gray-500 mt-0.5">{t.shares}</p>
                  </div>
                </div>
                <span className="text-[15px] font-semibold leading-6 text-gray-900 tabular-nums">{t.amount}</span>
              </div>
            ))}
          </div>

          {hasMoreTradeHistory && (
            <div className="mt-8 border-t border-gray-200 py-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleTradeHistoryCount((count) => Math.min(count + PAGE_SIZE, tradeHistory.length))}
                className="px-3 py-1.5 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
              >
                더 보기
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
