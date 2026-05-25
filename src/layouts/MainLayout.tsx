import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import TopBar from '../components/TopBar'

const TOP_BAR_PATHS = ['/chart', '/watchlist']

export default function MainLayout() {
  const { pathname } = useLocation()
  const showTopBar = TOP_BAR_PATHS.includes(pathname)
  const isChartPage = pathname === '/chart'

  return (
    <div className="screen flex flex-col">
      {showTopBar && <TopBar />}
      <main
        className={`flex-1 pb-[100px] ${isChartPage ? 'overflow-visible' : 'overflow-y-auto'} ${
          showTopBar ? '' : 'pt-[52px]'
        }`}
      >
        <div key={pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
