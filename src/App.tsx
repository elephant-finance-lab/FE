import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/auth/LoginPage'
import AgreementPage from './pages/auth/AgreementPage'
import BasicInfoPage from './pages/auth/BasicInfoPage'
import SurveyIntroPage from './pages/survey/SurveyIntroPage'
import SurveyQuestionPage from './pages/survey/SurveyQuestionPage'
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
import TradeAmountPage from './pages/trade/TradeAmountPage'
import TradeConfirmPage from './pages/trade/TradeConfirmPage'
import TradeCompletePage from './pages/trade/TradeCompletePage'
import NotificationPage from './pages/notification/NotificationPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/chart" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/agreement', element: <AgreementPage /> },
  { path: '/basic-info', element: <BasicInfoPage /> },
  { path: '/survey', element: <SurveyIntroPage /> },
  { path: '/survey/:step', element: <SurveyQuestionPage /> },
  {
    element: <MainLayout />,
    children: [
      { path: '/chart', element: <ChartPage /> },
      { path: '/watchlist', element: <WatchlistPage /> },
      { path: '/recommend', element: <RecommendPage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/mypage', element: <MyPage /> },
    ],
  },
  { path: '/watchlist/add-group', element: <AddGroupPage /> },
  { path: '/stock/:id', element: <StockDetailPage /> },
  { path: '/stock/:id/financials', element: <FinancialsPage /> },
  { path: '/stock/:id/daily-prices', element: <DailyPricesPage /> },
  { path: '/recommend/analyzing', element: <AnalyzingPage /> },
  { path: '/recommend/:id', element: <RecommendDetailPage /> },
  { path: '/notification', element: <NotificationPage /> },
  { path: '/trade/analyzing', element: <AnalyzingPage /> },
  { path: '/trade/amount', element: <TradeAmountPage /> },
  { path: '/trade/confirm', element: <TradeConfirmPage /> },
  { path: '/trade/complete', element: <TradeCompletePage /> },
  { path: '/mypage/edit-profile', element: <EditProfilePage /> },
  { path: '/mypage/account', element: <AccountPage /> },
  { path: '/mypage/account/register', element: <AccountRegisterPage /> },
  { path: '/mypage/account-delete', element: <AccountDeletePage /> },
  { path: '/mypage/account-link', element: <AccountLinkPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
