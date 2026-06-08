import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import AgreementPage from './pages/auth/AgreementPage'
import BasicInfoPage from './pages/auth/BasicInfoPage'
import ChartPage from './pages/chart/ChartPage'
import WatchlistPage from './pages/watchlist/WatchlistPage'
import AddGroupPage from './pages/watchlist/AddGroupPage'
import StockDetailPage from './pages/watchlist/StockDetailPage'
import FinancialsPage from './pages/watchlist/FinancialsPage'
import DailyPricesPage from './pages/watchlist/DailyPricesPage'
import RecommendPage from './pages/recommend/RecommendPage'
import RecommendDetailPage from './pages/recommend/RecommendDetailPage'
import PortfolioPage from './pages/portfolio/PortfolioPage'
import MyPage from './pages/mypage/MyPage'
import EditProfilePage from './pages/mypage/EditProfilePage'
import AccountPage from './pages/mypage/AccountPage'
import AccountRegisterPage from './pages/mypage/AccountRegisterPage'
import AccountDeletePage from './pages/mypage/AccountDeletePage'
import AccountLinkPage from './pages/mypage/AccountLinkPage'
import AnalyzingPage from './pages/trade/AnalyzingPage'
import TradeConfirmPage from './pages/trade/TradeConfirmPage'
import TradeCompletePage from './pages/trade/TradeCompletePage'
import { AuthProvider } from './contexts/AuthProvider'
import RequireAuth from './routes/RequireAuth'

function protectedElement(element: ReactNode, requireProfileComplete = true) {
  return <RequireAuth requireProfileComplete={requireProfileComplete}>{element}</RequireAuth>
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/chart" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/api/auth/me', element: <AuthCallbackPage /> },
  { path: '/agreement', element: protectedElement(<AgreementPage />, false) },
  { path: '/basic-info', element: protectedElement(<BasicInfoPage />, false) },
  {
    element: <MainLayout />,
    children: [
      { path: '/chart', element: <ChartPage /> },
      { path: '/watchlist', element: protectedElement(<WatchlistPage />) },
      { path: '/recommend', element: protectedElement(<RecommendPage />) },
      { path: '/portfolio', element: protectedElement(<PortfolioPage />) },
      { path: '/mypage', element: protectedElement(<MyPage />) },
    ],
  },
  { path: '/watchlist/add-group', element: protectedElement(<AddGroupPage />) },
  { path: '/stock/:id', element: <StockDetailPage /> },
  { path: '/stock/:id/financials', element: <FinancialsPage /> },
  { path: '/stock/:id/daily-prices', element: <DailyPricesPage /> },
  { path: '/recommend/analyzing', element: protectedElement(<AnalyzingPage />) },
  { path: '/recommend/:id', element: protectedElement(<RecommendDetailPage />) },
  { path: '/trade/analyzing', element: protectedElement(<AnalyzingPage />) },
  { path: '/trade/amount', element: <Navigate to="/trade/confirm" replace /> },
  { path: '/trade/confirm', element: protectedElement(<TradeConfirmPage />) },
  { path: '/trade/complete', element: protectedElement(<TradeCompletePage />) },
  { path: '/mypage/edit-profile', element: protectedElement(<EditProfilePage />) },
  { path: '/mypage/account', element: protectedElement(<AccountPage />) },
  { path: '/mypage/account/register', element: protectedElement(<AccountRegisterPage />) },
  { path: '/mypage/account-delete', element: protectedElement(<AccountDeletePage />) },
  { path: '/mypage/account-link', element: protectedElement(<AccountLinkPage />) },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
