import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'

const percentageOptions = ['5 ~ 10%', '10 ~ 15%', '10 ~ 20%', '20 ~ 30%', '20 ~ 40%']

export default function TradeAmountPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="screen-header pt-4 pb-2">
        <h1 className="section-title">매수 금액 설정</h1>
        <p className="body-copy mt-3">
          총 투자 금액 대비 비율을 선택해주세요
        </p>
      </div>

      <div className="screen-px mt-6">
        <div className="flex flex-wrap gap-2.5">
          {percentageOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelected(opt)}
              className={`h-[52px] px-5 rounded-[14px] text-[15px] font-medium leading-6 transition-all ${
                selected === opt
                  ? 'bg-toss-blue text-white shadow-[0_2px_8px_rgba(49,130,246,0.25)]'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <div className="screen-px">
        <Button disabled={!selected} onClick={() => navigate('/trade/confirm')}>
          다음
        </Button>
      </div>
    </div>
  )
}
