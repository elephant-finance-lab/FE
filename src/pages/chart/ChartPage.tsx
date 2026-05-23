import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trendingStocks } from '../../data/mockStocks'

const filterTabs = ['거래량', '급상승', '급하락', '시가총액', '체결강도']

export default function ChartPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(filterTabs[0])
  const [hearts, setHearts] = useState<Set<string>>(new Set())

  const toggleHeart = (id: string) => {
    const next = new Set(hearts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setHearts(next)
  }

  const handleLoadMore = () => {
    // hook for pagination
  }

  return (
    <div className="pb-2">
      <div className="border-b border-[rgba(217,217,217,0.7)] px-[27px] pt-6 pb-5">
        <span className="text-[15px] font-semibold leading-6 text-gray-900">실시간 차트</span>
      </div>

      <div className="pt-4 pb-12 px-[27px]">
        <div className="flex items-center gap-2.5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`h-[30px] px-3 rounded-[7px] text-[13px] leading-6 font-normal transition-colors ${
                activeTab === tab
                  ? 'bg-[rgba(217,217,217,0.4)] text-gray-900'
                  : 'bg-transparent text-gray-700/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-[33px] flex flex-col gap-9">
        {trendingStocks.map((stock, idx) => (
          <div
            key={stock.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/stock/${stock.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/stock/${stock.id}`)
            }}
            className="flex items-center gap-[22px] cursor-pointer"
          >
            <span className="text-[15px] font-semibold leading-6 text-gray-900 w-3 text-center shrink-0">
              {idx + 1}
            </span>
            <div className="flex items-center gap-[17px] flex-1 min-w-0">
              <div className="w-[33px] h-[33px] rounded-full bg-[#D9D9D9] shrink-0" />
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[15px] font-semibold leading-6 text-gray-900 truncate">
                  {stock.name}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[12px] leading-5 text-[#2B2B2B] tabular-nums font-light">
                    {stock.price}
                  </span>
                  <span
                    className={`text-[12px] leading-5 tabular-nums font-light ${
                      stock.isPositive ? 'text-toss-red' : 'text-[#3985FF]'
                    }`}
                  >
                    {stock.isPositive ? '+' : '-'}
                    {stock.changePercent}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleHeart(stock.id)
                }}
                className="w-6 h-6 flex items-center justify-center shrink-0"
                aria-label="관심"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={hearts.has(stock.id) ? '#FF3B30' : '#D9D9D9'}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex w-[393px] flex-col items-center gap-[12px]">
        <div className="w-full border-t border-[rgba(199,196,196,0.7)]" />
        <button
          type="button"
          onClick={handleLoadMore}
          className="px-3 py-3 text-[15px] font-light leading-6 text-gray-900 active:text-gray-500 transition-colors"
        >
          더 보기
        </button>
        <div className="w-full border-t border-[rgba(0,0,0,0.07)]" />
      </div>
    </div>
  )
}
