import type { AutoTradingReadiness } from '../apis/autoTrading'

const BLOCKED_REASON_LABELS: Record<string, string> = {
  readiness_unavailable: 'AI 준비 상태를 확인하지 못했습니다.',
  paper_bundle_id_missing: 'AI 모의 자동매매 번들 ID가 설정되지 않았습니다.',
  deploy_quality_blocked: 'AI 모의 자동매매 모델 검증이 아직 통과되지 않았습니다.',
  broker_evidence_blocked: 'KIS 모의 주문 경로 증거가 아직 준비되지 않았습니다.',
  readiness_status_not_pass: 'AI 자동매매 준비가 아직 완료되지 않았습니다.',
  order_actions_disabled: 'AI 주문 액션 게이트가 아직 열리지 않았습니다.',
  live_action_gate_enabled: '라이브 주문 게이트가 감지되어 모의 자동매매를 시작할 수 없습니다.',
  readiness_gate_blocked: 'AI 자동매매 안전 게이트가 시작을 차단했습니다.',
}

export function isPaperAutoTradingReady(readiness: AutoTradingReadiness | null) {
  if (!readiness) return false

  return Boolean(
    readiness.canStartPaperAutoTrading &&
      readiness.safeToEnableOrderActions &&
      !readiness.liveTradingAllowed &&
      !readiness.safeToEnableLiveActions,
  )
}

export function autoTradingReadinessMessage(readiness: AutoTradingReadiness | null) {
  if (!readiness) {
    return 'AI 자동매매 준비 상태를 확인 중입니다.'
  }
  const reason = readiness.blockedReason
  if (reason && BLOCKED_REASON_LABELS[reason]) {
    return BLOCKED_REASON_LABELS[reason]
  }
  if (!isPaperAutoTradingReady(readiness)) {
    return 'AI 자동매매를 시작할 수 없는 상태입니다.'
  }
  return 'AI 모의 자동매매를 시작할 수 있습니다.'
}
