import BackButton from '../../components/BackButton'

interface Notification {
  id: string
  type: 'trade' | 'payment' | 'recommend'
  title: string
  description: string
  date: string
  time: string
}

const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'trade',
    title: '매수 체결 완료',
    description: '애플 5주 | 체결가 ₩60,000 | 총 ₩300,000',
    date: '4월 9일',
    time: '14:32',
  },
  {
    id: 'n2',
    type: 'payment',
    title: '결제 완료',
    description: '애플 5주 | ₩300,000 + 수수료 ₩1,500 = ₩301,500',
    date: '4월 9일',
    time: '14:32',
  },
  {
    id: 'n3',
    type: 'recommend',
    title: 'AI 종목 추천',
    description: '새로운 맞춤 추천 종목이 업데이트되었습니다',
    date: '4월 8일',
    time: '09:00',
  },
]

export default function NotificationPage() {
  return (
    <div className="screen pb-10">
      <div className="px-6 pt-[52px]">
        <BackButton />
      </div>

      <div className="px-6 pt-4">
        <h1 className="section-title mb-6">알림</h1>

        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 py-4 px-4 bg-gray-50 rounded-[15px]">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'trade' ? 'bg-toss-blue-light' : n.type === 'payment' ? 'bg-green-50' : 'bg-orange-50'
                }`}
              >
                {n.type === 'trade' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#3182F6">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                )}
                {n.type === 'payment' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#34C759">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                {n.type === 'recommend' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF9500">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium leading-6 text-gray-900">{n.title}</p>
                <p className="text-[13px] leading-5 text-gray-500 mt-1">{n.description}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-[12px] leading-4 text-gray-400">{n.date}</span>
                <p className="text-[11px] leading-4 text-gray-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
