import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'

export default function TradeConfirmPage() {
  const navigate = useNavigate()

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="flex-1 screen-px pt-4">
        <h1 className="section-title mb-8 whitespace-pre-line">
          {'애플 (AAPL)을\n매수하시겠습니까?'}
        </h1>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-[15px] p-5">
            <h3 className="text-[15px] font-medium leading-6 text-gray-900 mb-3">주문 정보</h3>
            <div className="text-[15px] leading-6 text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>주문 수량</span>
                <span className="font-medium text-gray-900">5주</span>
              </div>
              <div className="flex justify-between">
                <span>주문 단가</span>
                <span className="font-medium text-gray-900 tabular-nums">₩60,000</span>
              </div>
              <div className="flex justify-between">
                <span>주문 금액</span>
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
          <p>주문 가격은 시장 상황에 따라 변동될 수 있습니다</p>
          <p>일부 또는 전부 체결되지 않을 수 있습니다</p>
        </div>
      </div>

      <div className="screen-px flex flex-col gap-3">
        <Button onClick={() => navigate('/trade/complete')}>
          AI 자동 매매 시작
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          취소
        </Button>
      </div>
    </div>
  )
}
