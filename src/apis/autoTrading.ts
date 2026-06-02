import { apiRequest } from '../lib/apiClient'

export type AutoTradingSessionStatus =
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'COMPLETED'

export interface AutoTradingSession {
  sessionId: string
  status: AutoTradingSessionStatus
  selectedTickers: string[]
  recommendationIds: number[]
  purchaseOptionId: number
  aiRequestId: string | null
  aiSessionId: string | null
  aiStatusMessage: string | null
  startedAt: string | null
  stoppedAt: string | null
  failedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface AutoTradingAiStatus {
  sessionId: string
  sessionStatus: AutoTradingSessionStatus
  aiSessionId: string | null
  matchesSession: boolean
  running: boolean
  status: string | null
}

export interface AutoTradingReadiness {
  status: string | null
  generatedAt: string | null
  bundleId: string | null
  deployQuality: string | null
  brokerEvidence: string | null
  liveTradingAllowed: boolean
  registryMutated: boolean
  safeToShowDashboard: boolean
  safeToEnableOrderActions: boolean
  safeToEnableLiveActions: boolean
  canStartPaperAutoTrading: boolean
  blockedReason: string | null
  detailsJson: string | null
}

export interface StartAutoTradingRequest {
  recommendationIds: number[]
  purchaseOptionId: number
  cycles: number
  intervalSec: number
}

export const DEFAULT_AUTO_TRADING_SETTINGS = {
  purchaseOptionId: 2,
  cycles: 3,
  intervalSec: 10,
} as const

export function isActiveAutoTradingStatus(status: AutoTradingSessionStatus | undefined) {
  return status === 'STARTING' || status === 'RUNNING' || status === 'STOPPING'
}

export function isRunningAutoTradingStatus(status: string | null | undefined) {
  return ['RUNNING', 'ACTIVE', 'STARTED'].includes(String(status ?? '').toUpperCase())
}

export function getActiveAutoTradingSession() {
  return apiRequest<AutoTradingSession | null>('/api/auto-trading/sessions/active')
}

export function getAutoTradingSession(sessionId: string) {
  return apiRequest<AutoTradingSession>(
    `/api/auto-trading/sessions/${encodeURIComponent(sessionId)}`,
  )
}

export function getAutoTradingAiStatus(sessionId: string) {
  return apiRequest<AutoTradingAiStatus>(
    `/api/auto-trading/sessions/${encodeURIComponent(sessionId)}/ai-status`,
  )
}

export function getAutoTradingReadiness() {
  return apiRequest<AutoTradingReadiness>('/api/auto-trading/sessions/readiness')
}

export async function getRunningAutoTradingSession() {
  const session = await getActiveAutoTradingSession()
  if (!session) return null

  const aiStatus = await getAutoTradingAiStatus(session.sessionId)
  if (!aiStatus.running || !isRunningAutoTradingStatus(aiStatus.status)) {
    return null
  }

  return { ...session, status: 'RUNNING' as const }
}

export async function getAutoTradingSessionWithStatus(sessionId: string) {
  const session = await getAutoTradingSession(sessionId)
  if (!isActiveAutoTradingStatus(session.status)) return session

  const aiStatus = await getAutoTradingAiStatus(sessionId)
  return { ...session, status: aiStatus.sessionStatus }
}

export function startAutoTradingSession(payload: StartAutoTradingRequest, idempotencyKey: string) {
  return apiRequest<AutoTradingSession>('/api/auto-trading/sessions', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  })
}

export function stopAutoTradingSession(sessionId: string) {
  return apiRequest<AutoTradingSession>(
    `/api/auto-trading/sessions/${encodeURIComponent(sessionId)}/stop`,
    { method: 'POST' },
  )
}
