import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getAutoTradingSessionWithStatus,
  getRunningAutoTradingSession,
  isActiveAutoTradingStatus,
  type AutoTradingSession,
  type AutoTradingSessionStatus,
} from '../../apis/autoTrading'
import Button from '../../components/Button'
import {
  readRunningAutoTradingState,
  saveRunningAutoTradingState,
  type PendingAutoTradingSelection,
} from '../../lib/autoTradingStorage'

interface TradeRunningRouteState {
  session?: AutoTradingSession
  selection?: PendingAutoTradingSelection | null
  started?: boolean
}

function statusText(status: AutoTradingSessionStatus | undefined) {
  const labels: Record<AutoTradingSessionStatus, string> = {
    STARTING: '시작 중',
    RUNNING: '실행 중',
    STOPPING: '중단 처리 중',
    STOPPED: '중단됨',
    FAILED: '실행 실패',
    COMPLETED: '실행 종료',
  }
  return status ? labels[status] : '상태 확인 중'
}

export default function TradeCompletePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as TradeRunningRouteState | null
  const [storedState] = useState(() => readRunningAutoTradingState())
  const initialSession = routeState?.session ?? storedState?.session ?? null
  const initialSelection =
    routeState?.selection ??
    (storedState && storedState.session.sessionId === initialSession?.sessionId
      ? storedState.selection
      : null)
  const [session, setSession] = useState<AutoTradingSession | null>(initialSession)
  const [selection, setSelection] = useState<PendingAutoTradingSelection | null>(initialSelection)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const [statusError, setStatusError] = useState<string | null>(null)
  const justStarted = Boolean(routeState?.started)

  useEffect(() => {
    let current = true
    const timer = window.setTimeout(() => {
      setStatusError(null)
      const request = session?.sessionId
        ? getAutoTradingSessionWithStatus(session.sessionId)
        : getRunningAutoTradingSession()
      void request
        .then((nextSession) => {
          if (!current || !nextSession) return
          setSession(nextSession)
          const nextSelection =
            selection ??
            (storedState?.session.sessionId === nextSession.sessionId ? storedState.selection : null)
          if (nextSelection !== selection) setSelection(nextSelection)
          saveRunningAutoTradingState({ session: nextSession, selection: nextSelection })
        })
        .catch((error) => {
          if (current) {
            setStatusError(error instanceof Error ? error.message : '자동매매 상태를 확인하지 못했습니다.')
          }
        })
        .finally(() => {
          if (current) setIsLoading(false)
        })
    }, 0)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [selection, session?.sessionId, storedState])

  const visibleTargets = useMemo(() => {
    if (!selection || !session) return []
    if (session.selectedTickers.length === 0) return selection.targets
    return selection.targets.filter((target) => session.selectedTickers.includes(target.stockCode))
  }, [selection, session])

  const title =
    justStarted && session && isActiveAutoTradingStatus(session.status)
      ? 'AI 자동매매가 시작되었습니다'
      : 'AI 자동매매 실행 현황'

  return (
    <div className="screen flex flex-col px-6 pt-[72px] pb-10">
      <div className="flex-1">
        <div className="mb-8 flex items-center gap-3 animate-fade-in-up">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-toss-blue shadow-[0_2px_8px_rgba(49,130,246,0.3)]">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="section-title">{title}</h1>
        </div>

        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="rounded-[15px] bg-gray-50 p-5">
            <h2 className="mb-3 text-[15px] font-medium leading-6 text-gray-900">실행 정보</h2>
            <div className="flex justify-between text-[15px] leading-6 text-gray-600">
              <span>상태</span>
              <span className="font-medium text-toss-blue">
                {isLoading ? '확인 중' : statusText(session?.status)}
              </span>
            </div>
          </div>

          <div className="rounded-[15px] bg-gray-50 p-5">
            <h2 className="mb-3 text-[15px] font-medium leading-6 text-gray-900">자동매매 대상 종목</h2>
            {visibleTargets.length > 0 &&
              visibleTargets.map((target) => (
                <div key={`${target.recommendationId ?? target.stockCode}-${target.stockCode}`} className="flex justify-between py-1 text-[15px] leading-6">
                  <span className="text-gray-900">{target.stockName}</span>
                  <span className="text-gray-500">{target.stockCode}</span>
                </div>
              ))}
            {visibleTargets.length === 0 &&
              (session?.selectedTickers ?? []).map((ticker) => (
                <div key={ticker} className="py-1 text-[15px] leading-6 text-gray-900">
                  {ticker}
                </div>
              ))}
            {!isLoading && visibleTargets.length === 0 && (session?.selectedTickers.length ?? 0) === 0 && (
              <p className="text-[14px] leading-6 text-gray-500">표시할 대상 종목 정보가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-1 text-[13px] leading-5 text-gray-400">
          {statusError && <p className="text-error">{statusError}</p>}
          <p>AI가 시장 상황을 분석해 매수·매도 타이밍을 판단합니다.</p>
          <p>체결 내역은 My 수익률 또는 포트폴리오에서 확인할 수 있습니다.</p>
        </div>
      </div>

      <Button onClick={() => navigate('/portfolio')}>
        내 수익률 확인하기
      </Button>
    </div>
  )
}
