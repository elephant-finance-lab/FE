import { useNavigate } from 'react-router-dom'

interface MenuEntry {
  label: string
  to: string
}

const menuItems: MenuEntry[] = [
  { label: '내 정보 수정', to: '/mypage/edit-profile' },
  { label: '계좌 등록', to: '/mypage/account' },
  { label: '계좌 삭제', to: '/mypage/account-delete' },
  { label: '선호도 조사', to: '/survey' },
  { label: '로그아웃', to: '/login' },
  { label: '탈퇴', to: '/login' },
]

const user = { name: '김이박' }

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <div className="pb-10">
      <div className="pt-[68px] pb-7 flex flex-col items-center gap-[15px]">
        <div className="w-[59px] h-[59px] rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-[18px] font-semibold leading-6 text-gray-900">{user.name}</p>
      </div>

      <div className="px-5 flex flex-col">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => navigate(item.to)}
            className="h-[44px] flex items-center text-left text-[15px] font-semibold leading-6 text-gray-900 active:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
