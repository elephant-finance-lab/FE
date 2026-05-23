import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'
import { recommendedStocks } from '../../data/mockStocks'

export default function RecommendPage() {
  const navigate = useNavigate()
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set())

  const hasSelectedStocks = selectedStocks.size > 0

  const toggleStock = (id: string) => {
    setSelectedStocks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBuy = () => {
    if (!hasSelectedStocks) return
    navigate('/trade/amount')
  }

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 pb-6">
        <h1 className="section-title">종목 추천</h1>
        <p className="body-copy mt-3">AI가 분석한 맞춤 추천 종목입니다</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-toss-blue-light px-3 py-2 rounded-[10px]">
          <span className="text-[13px] leading-5 font-medium text-toss-blue">안정형 투자자</span>
          <span className="text-[12px] leading-5 text-gray-500">변동성 낮고 배당있는 종목</span>
        </div>
      </div>

      <div className="px-6">
        {recommendedStocks.map((stock, idx) => {
          const isSelected = selectedStocks.has(stock.id)
          return (
            <div
              key={stock.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/recommend/${stock.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/recommend/${stock.id}`)
              }}
              className="flex items-center py-3.5 cursor-pointer active:bg-gray-50 rounded-xl transition-colors"
            >
              <span className="w-7 text-[15px] font-normal leading-6 text-gray-900 text-center shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0 ml-4">
                <p className="text-[15px] font-medium leading-6 text-gray-900 truncate">{stock.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[13px] leading-5 text-gray-500 font-normal tabular-nums">
                    {stock.price}
                  </span>
                  <span
                    className={`text-[12px] leading-4 font-medium tabular-nums ${
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
                  toggleStock(stock.id)
                }}
                className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? 'text-toss-blue' : 'text-[#D9D9D9]'
                }`}
                aria-label={isSelected ? '선택 해제' : '선택'}
                aria-pressed={isSelected}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2.4"
                  />
                  <path
                    d="M8 12.2l2.8 2.8L16.5 9"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      <div className="px-6 mt-8">
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleBuy}
            disabled={!hasSelectedStocks}
            variant={hasSelectedStocks ? 'primary' : 'secondary'}
            className="disabled:opacity-100"
          >
            매수 진행하기
          </Button>
        </div>
      </div>
    </div>
  )
}
