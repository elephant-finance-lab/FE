import { useNavigate } from 'react-router-dom'

interface DailyRow {
  date: string
  close: string
  changePercent: string
  isPositive: boolean
  volume: string
  amount: string
}

const rows: DailyRow[] = Array.from({ length: 16 }, () => ({
  date: '03.27',
  close: '999,000원',
  changePercent: '+2.2%',
  isPositive: true,
  volume: '51,576,668',
  amount: '6.9조',
}))

export default function DailyPricesPage() {
  const navigate = useNavigate()

  return (
    <div className="screen pb-10">
      <header className="grid grid-cols-[auto_1fr_auto] items-center px-6 pt-[44px] pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="justify-self-start -ml-1 w-10 h-10 flex items-center justify-center"
        >
          <svg
            width="14"
            height="24"
            viewBox="0 0 12 24"
            fill="none"
            stroke="#191F28"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="10 4 2 12 10 20" />
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[12px] leading-4 text-gray-400">애플</span>
          <span className="text-[14px] leading-5 font-medium text-toss-red tabular-nums">
            999,000원 +2.2%
          </span>
        </div>

        <span className="w-10" aria-hidden />
      </header>

      <div className="px-6 mt-3">
        <div className="inline-flex flex-col">
          <h2 className="text-[16px] leading-6 font-bold text-gray-900 px-1">일별 시세</h2>
          <div className="h-[2px] bg-gray-900 mt-1.5" />
        </div>
      </div>

      <div className="px-6 mt-6 animate-fade-in-up">
        <table className="w-full">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[28%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="text-left text-[11px] leading-4 font-normal text-gray-400 pb-4">
                날짜
              </th>
              <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">
                <span className="inline-flex items-center gap-1">
                  종가
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-gray-400">
                    <path d="M4 1L7 6H1L4 1Z" />
                  </svg>
                </span>
              </th>
              <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">
                등락률
              </th>
              <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">
                거래량(주)
              </th>
              <th className="text-right text-[11px] leading-4 font-normal text-gray-400 pb-4">
                거래매수
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="text-left text-[13px] leading-5 text-gray-700 py-2.5 tabular-nums">
                  {r.date}
                </td>
                <td className="text-right text-[13px] leading-5 text-gray-900 py-2.5 tabular-nums font-normal">
                  {r.close}
                </td>
                <td
                  className={`text-right text-[13px] leading-5 py-2.5 tabular-nums font-medium ${
                    r.isPositive ? 'text-toss-red' : 'text-[#3985FF]'
                  }`}
                >
                  {r.changePercent}
                </td>
                <td className="text-right text-[13px] leading-5 text-gray-700 py-2.5 tabular-nums">
                  {r.volume}
                </td>
                <td className="text-right text-[13px] leading-5 text-gray-700 py-2.5 tabular-nums">
                  {r.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
