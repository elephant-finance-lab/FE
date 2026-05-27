import { useNavigate } from 'react-router-dom'
import { withdrawUser } from '../../apis/auth'
import { useAuth } from '../../contexts/useAuth'

interface MenuEntry {
  label: string
  to: string
}

const menuItems: MenuEntry[] = [
  { label: '내 정보 수정', to: '/mypage/edit-profile' },
  { label: '계좌 관리', to: '/mypage/account' },
]

export default function MyPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const displayName = user?.profile?.name ?? user?.userId ?? '사용자'

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleWithdraw = async () => {
    const confirmed = window.confirm('정말 탈퇴하시겠어요?')
    if (!confirmed) return

    await withdrawUser()
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="pb-10">
      <div className="pt-[68px] pb-7 flex flex-col items-center gap-[15px]">
        <img src="/logo.png" alt="" className="w-[59px] h-[59px] object-contain" />
        <p className="text-[18px] font-semibold leading-6 text-gray-900">{displayName}</p>
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
        <button
          onClick={handleLogout}
          className="h-[44px] flex items-center text-left text-[15px] font-semibold leading-6 text-gray-900 active:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors"
        >
          로그아웃
        </button>
        <button
          onClick={handleWithdraw}
          className="h-[44px] flex items-center text-left text-[15px] font-semibold leading-6 text-gray-900 active:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors"
        >
          탈퇴
        </button>
      </div>
    </div>
  )
}
