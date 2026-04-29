import { useNavigate } from 'react-router-dom'

const indices = [
  { name: '코스피', value: '5,438.87', changePercent: '0.3%', isPositive: false },
  { name: '코스닥', value: '1,141.51', changePercent: '0.3%', isPositive: true },
]

export default function TopBar() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between px-[17px] pt-[30px] pb-[22px] bg-white">
      <div className="flex items-stretch">
        {indices.map((index, i) => (
          <div key={index.name} className="flex items-stretch">
            {i > 0 && <div className="mx-3 my-1 border-l border-dashed border-gray-300" />}
            <div className="flex flex-col justify-center">
              <span className="text-[13px] leading-[18px] text-gray-500 font-normal">{index.name}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] leading-6 font-semibold text-gray-900 tabular-nums">{index.value}</span>
                <span className={`text-[13px] leading-6 font-medium tabular-nums ${index.isPositive ? 'text-toss-red' : 'text-[#3985FF]'}`}>
                  {index.isPositive ? '+' : '-'}{index.changePercent}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/notification')}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#9E9E9E">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </button>
    </div>
  )
}
