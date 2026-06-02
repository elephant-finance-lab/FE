import type { AutoTradingSession } from '../apis/autoTrading'

const PENDING_SELECTION_KEY = 'elephant_auto_trading_pending_selection'
const RUNNING_SESSION_KEY = 'elephant_auto_trading_running_session'

export interface AutoTradingTarget {
  recommendationId: number | null
  stockName: string
  stockCode: string
  riskLevel: string | null
}

export interface PendingAutoTradingSelection {
  recommendationIds: number[]
  stockCodes: string[]
  targets: AutoTradingTarget[]
  idempotencyKey: string
}

export interface RunningAutoTradingState {
  session: AutoTradingSession
  selection: PendingAutoTradingSelection | null
}

function parseStorageValue<T>(key: string) {
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    sessionStorage.removeItem(key)
    return null
  }
}

export function createAutoTradingIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `auto-trading-${crypto.randomUUID()}`
  }
  return `auto-trading-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function readPendingAutoTradingSelection() {
  return parseStorageValue<PendingAutoTradingSelection>(PENDING_SELECTION_KEY)
}

export function savePendingAutoTradingSelection(selection: PendingAutoTradingSelection) {
  sessionStorage.setItem(PENDING_SELECTION_KEY, JSON.stringify(selection))
}

export function clearPendingAutoTradingSelection() {
  sessionStorage.removeItem(PENDING_SELECTION_KEY)
}

export function readRunningAutoTradingState() {
  return parseStorageValue<RunningAutoTradingState>(RUNNING_SESSION_KEY)
}

export function saveRunningAutoTradingState(state: RunningAutoTradingState) {
  sessionStorage.setItem(RUNNING_SESSION_KEY, JSON.stringify(state))
}

export function clearRunningAutoTradingState() {
  sessionStorage.removeItem(RUNNING_SESSION_KEY)
}
