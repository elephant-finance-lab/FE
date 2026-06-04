import { ApiError } from './apiClient'

const STALE_REASON_LABELS: Record<string, string> = {
  cache_stale: '마지막 추천 캐시가 오래되었습니다',
  market_closed: '현재 장 시간이 아니라 신규 추천 갱신이 제한됩니다',
  minute_bars_unavailable: '최근 1분봉 데이터가 아직 없습니다',
  partial_minute_bars_unavailable: '일부 종목의 최근 1분봉 데이터가 아직 없습니다',
  market_data_unavailable: '시장 데이터가 아직 준비되지 않았습니다',
  no_recent_recommendations: '표시할 최신 추천 캐시가 아직 없습니다',
}

export function formatCacheAgeSec(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < 60) return `${Math.floor(value)}초 전`
  if (value < 3600) return `${Math.floor(value / 60)}분 전`
  return `${Math.floor(value / 3600)}시간 전`
}

export function recommendationStaleReasonText(reason: string | null | undefined) {
  const normalized = String(reason ?? '').trim()
  if (!normalized) return null
  return STALE_REASON_LABELS[normalized] ?? normalized.replaceAll('_', ' ')
}

export function recommendationStaleSummary(
  staleReason: string | null | undefined,
  cacheAgeText: string | null,
) {
  const parts = [recommendationStaleReasonText(staleReason), cacheAgeText].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '최신 추천 갱신 대기 중'
}

export function recommendationStaleNotice({
  stale,
  staleReason,
  cacheAgeText,
}: {
  stale: boolean
  staleReason: string | null | undefined
  cacheAgeText: string | null
}) {
  if (!stale) return null
  return `추천 데이터가 최신이 아닙니다: ${recommendationStaleSummary(
    staleReason,
    cacheAgeText,
  )}. 새 추천 갱신 후 자동매매를 시작해주세요.`
}

export function recommendationUnavailableMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const message = (error.message ?? '').toLowerCase()
    if (error.code === 'AI504_01' || error.status === 504 || message.includes('deadline')) {
      return 'AI 추천 계산 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    }
    if (
      error.code === 'RECOMMENDATION503_01' ||
      error.status === 503 ||
      message.includes('minute_bars_unavailable')
    ) {
      return '추천을 표시할 수 없습니다. 장중 1분봉 데이터나 저장된 추천 캐시가 아직 준비되지 않았습니다.'
    }
  }

  return error instanceof Error && error.message ? error.message : fallback
}
