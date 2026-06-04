import type { AutoTradingReadiness } from '../apis/autoTrading'

const REQUIRED_READINESS_FIELDS = [
  'status',
  'canStartPaperAutoTrading',
  'safeToEnableOrderActions',
  'activeSessionExists',
  'liveTradingAllowed',
  'registryMutated',
  'safeToEnableLiveActions',
] as const

type RequiredReadinessField = (typeof REQUIRED_READINESS_FIELDS)[number]

const REQUIRED_READINESS_FIELD_LABELS: Record<RequiredReadinessField, string> = {
  status: 'AI 준비 상태',
  canStartPaperAutoTrading: '모의 자동매매 시작 가능 여부',
  safeToEnableOrderActions: '주문 액션 안전 게이트',
  activeSessionExists: '실행 중 세션 여부',
  liveTradingAllowed: '라이브 거래 허용 여부',
  registryMutated: '운영 레지스트리 변경 여부',
  safeToEnableLiveActions: '라이브 주문 게이트',
}

const BLOCKED_REASON_LABELS: Record<string, string> = {
  readiness_unavailable: 'AI 준비 상태를 확인하지 못했습니다.',
  ai_readiness_unavailable: 'AI 준비 상태를 확인하지 못했습니다.',
  paper_bundle_id_missing: 'AI 모의 자동매매 번들 ID가 설정되지 않았습니다.',
  deploy_quality_blocked: 'AI 모의 자동매매 모델 검증이 아직 통과되지 않았습니다.',
  broker_evidence_blocked: 'KIS 모의 주문 경로 증거가 아직 준비되지 않았습니다.',
  broker_evidence_not_pass: 'KIS virtual paper evidence가 PASS가 아닙니다.',
  readiness_status_not_pass: 'AI 자동매매 준비가 아직 완료되지 않았습니다.',
  order_actions_disabled: 'AI 주문 액션 게이트가 아직 열리지 않았습니다.',
  order_actions_not_enabled: 'AI 주문 액션 게이트가 닫혀 있습니다.',
  paper_candidate_registry_not_found: '선택 후보의 paper registry가 없습니다.',
  paper_candidate_registry_invalid_json: '선택 후보의 paper registry 형식을 읽을 수 없습니다.',
  paper_candidate_registry_bundle_mismatch: '선택 후보의 paper registry 번들이 요청 번들과 일치하지 않습니다.',
  paper_candidate_metadata_bundle_mismatch: '선택 후보의 메타데이터 번들이 요청 번들과 일치하지 않습니다.',
  paper_candidate_feature_manifest_mismatch: '선택 후보의 feature manifest가 요청 번들과 일치하지 않습니다.',
  market_closed: '현재 장 시간이 아닙니다.',
  no_remaining_cycles: '남은 자동매매 cycle이 없습니다.',
  starting_timeout: 'AI 자동매매 세션 수락 시간이 초과되었습니다.',
  starting_session_timeout: 'AI 자동매매 세션 수락 시간이 초과되었습니다.',
  active_session_exists: '이미 실행 중이거나 시작 중인 모의 자동매매 세션이 있습니다.',
  recommendation_bundle_mismatch: '선택한 추천 종목의 모델 번들이 현재 자동매매 후보와 일치하지 않습니다.',
  recommendation_cache_stale: '선택한 추천 데이터가 최신이 아니어서 자동매매를 시작할 수 없습니다.',
  recommendation_generated_at_missing: '선택한 추천 데이터의 생성 시각을 확인할 수 없습니다.',
  recommendation_generated_at_invalid: '선택한 추천 데이터의 생성 시각이 유효하지 않습니다.',
  live_trading_allowed_true: '라이브 거래 허용 신호가 감지되어 모의 자동매매를 시작할 수 없습니다.',
  registry_mutated_true: '운영 모델 레지스트리 변경이 감지되어 모의 자동매매를 시작할 수 없습니다.',
  live_action_gate_enabled: '라이브 주문 게이트가 감지되어 모의 자동매매를 시작할 수 없습니다.',
  live_actions_enabled: '라이브 주문 게이트가 감지되어 모의 자동매매를 시작할 수 없습니다.',
  readiness_gate_blocked: 'AI 자동매매 안전 게이트가 시작을 차단했습니다.',
}

function missingReadinessFields(readiness: AutoTradingReadiness | null) {
  if (!readiness) return REQUIRED_READINESS_FIELDS
  return REQUIRED_READINESS_FIELDS.filter((field) => {
    const value = readiness[field]
    return value === null || value === undefined
  })
}

export function isPaperAutoTradingReady(readiness: AutoTradingReadiness | null) {
  if (!readiness) return false
  if (missingReadinessFields(readiness).length > 0) return false

  return (
    readiness.status === 'PASS' &&
    readiness.canStartPaperAutoTrading === true &&
    readiness.safeToEnableOrderActions === true &&
    readiness.activeSessionExists === false &&
    readiness.liveTradingAllowed === false &&
    readiness.registryMutated === false &&
    readiness.safeToEnableLiveActions === false
  )
}

export function autoTradingReadinessMessage(readiness: AutoTradingReadiness | null) {
  if (!readiness) {
    return 'AI 자동매매 준비 상태를 확인 중입니다.'
  }
  const missingFields = missingReadinessFields(readiness)
  if (missingFields.length > 0) {
    const labels = missingFields.map((field) => REQUIRED_READINESS_FIELD_LABELS[field]).join(', ')
    return `AI 자동매매 안전 게이트 정보가 부족합니다: ${labels}.`
  }
  const reason = readiness.blockedReason
  if (reason && BLOCKED_REASON_LABELS[reason]) {
    return BLOCKED_REASON_LABELS[reason]
  }
  if (!isPaperAutoTradingReady(readiness)) {
    return reason
      ? `AI 자동매매 시작 조건이 아직 충족되지 않았습니다. 사유: ${reason}`
      : 'AI 자동매매를 시작할 수 없는 상태입니다.'
  }
  return 'AI 모의 자동매매를 시작할 수 있습니다.'
}
