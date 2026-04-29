import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../../components/BackButton'
import Button from '../../components/Button'

interface Category {
  id: string
  title: string
  hint: string
}

const categories: Category[] = [
  { id: 'bank', title: '은행', hint: '금융사 선택하기' },
  { id: 'securities', title: '증권', hint: '모든 금융사' },
  { id: 'card', title: '카드', hint: '금융사 선택하기' },
  { id: 'insurance', title: '보험 & 보증보험', hint: '기관 선택하기' },
  { id: 'point', title: '포인트 & 페이머니', hint: '서비스 선택하기' },
  { id: 'human', title: '휴면자산', hint: '오래된 돈 찾기' },
]

export default function AccountLinkPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div className="screen flex flex-col pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-[35px] pt-[52px] flex-1">
        <h1 className="text-[25px] font-semibold leading-[1.2] text-gray-900 mb-6">
          불러올 계좌 선택
        </h1>

        <ul className="flex flex-col gap-[10px]">
          {categories.map((category) => {
            const isSelected = selected.has(category.id)
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => toggle(category.id)}
                  className="w-full flex items-center justify-between rounded-[30px] bg-[rgba(217,217,217,0.5)] pl-[26px] pr-[19px] pt-3 pb-[17px]"
                >
                  <div className="flex flex-col items-start gap-[7px]">
                    <span className="text-[18px] font-semibold leading-[1.2] text-gray-900">{category.title}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-light leading-[1.2] text-gray-500">
                      {category.hint}
                      <svg width="5" height="7" viewBox="0 0 5 7" fill="none" stroke="#646464" strokeWidth="1.2">
                        <path d="M1 1l3 2.5L1 6" />
                      </svg>
                    </span>
                  </div>
                  <span className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-toss-blue' : 'bg-white border border-gray-300'}`}>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="px-[29px] pt-8">
        <Button disabled={selected.size === 0} onClick={() => navigate('/mypage')}>
          연동하기
        </Button>
      </div>
    </div>
  )
}
