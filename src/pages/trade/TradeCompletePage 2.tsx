import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function TradeCompletePage() {
  const navigate = useNavigate()

  return (
    <div className="screen flex flex-col px-6 pt-[72px] pb-10">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-8 animate-fade-in-up">
          <div className="w-10 h-10 rounded-full bg-toss-blue flex items-center justify-center shadow-[0_2px_8px_rgba(49,130,246,0.3)]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="section-title">AI 자동 매매 완료</h1>
        </div>

        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-gray-50 rounded-[15px] p-5">
            <h3 className="text-[15px] font-medium leading-6 text-gray-900 mb-3">체결 정보</h3>
            <div className="text-[15px] leading-6 text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>종목</span>
                <span className="font-medium text-gray-900">애플 (AAPL)</span>
              </div>
              <div className="flex justify-between">
                <span>체결 수량</span>
                <span className="font-medium text-gray-900">5주</span>
              </div>
              <div className="flex justify-between">
                <span>체결 단가</span>
                <span className="font-medium text-gray-900 tabular-nums">₩60,000</span>
              </div>
              <div className="flex justify-between">
                <span>체결 금액</span>
                <span className="font-medium text-gray-900 tabular-nums">₩300,000</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-[15px] p-5">
            <h3 className="text-[15px] font-medium leading-6 text-gray-900 mb-3">결제 금액</h3>
            <div className="text-[15px] leading-6 text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>주문 금액</span>
                <span className="font-medium text-gray-900 tabular-nums">₩300,000</span>
              </div>
              <div className="flex justify-between">
                <span>수수료</span>
                <span className="font-medium text-gray-900 tabular-nums">₩1,500</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 mt-1">
                <span className="font-semibold text-gray-900">총 결제 금액</span>
                <span className="font-bold text-gray-900 tabular-nums">₩301,500</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 text-[13px] leading-5 text-gray-400 space-y-1">
          <p>체결 내역은 My 수익률에서 확인할 수 있습니다</p>
        </div>
      </div>

      <Button onClick={() => navigate('/portfolio')}>
        내 수익률 확인하기
      </Button>
    </div>
  )
}
