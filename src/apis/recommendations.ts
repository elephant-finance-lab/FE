import { apiRequest } from '../lib/apiClient'

export interface RecommendationInfo {
  recommendationId: number | null
  modelRecommendationId: string | null
  rank: number | null
  tickerCode: string | null
  stockCode: string | null
  companyName: string | null
  stockName: string | null
  logoUrl: string | null
  currentPrice: number | null
  changeRate: number | null
  currency: string | null
  isSelected: boolean | null
  reason: string | null
  score: number | null
  expectedReturn: number | null
  expectedReturnAvailable: boolean | null
  riskLevel: string | null
  modelVersion: string | null
  bundleId: string | null
}

export interface RecommendationList {
  userProfileSummary: string | null
  modelStatus: string | null
  modelReason: string | null
  generatedAt: string | null
  bundleId: string | null
  modelVersion: string | null
  asof: string | null
  mode: string | null
  cacheAgeSec: number | null
  stale: boolean | null
  staleReason: string | null
  advisoryOnly: boolean | null
  safeToEnableOrderActions: boolean | null
  liveTradingAllowed: boolean | null
  recommendations: RecommendationInfo[] | null
}

export interface RecommendationDetailSections {
  recommendReason: string | null
  companySummary: string | null
  growthPoint: string | null
  priceAttractiveness: string | null
  risk: string | null
}

export interface RecommendationDetail {
  recommendationId: number | null
  modelRecommendationId: string | null
  tickerCode: string | null
  stockCode: string | null
  companyName: string | null
  stockName: string | null
  logoUrl: string | null
  userProfileSummary: string | null
  sections: RecommendationDetailSections | null
  recommendReason: string | null
  companySummary: string | null
  growthPoint: string | null
  priceAttractiveness: string | null
  risk: string | null
  currentPrice: number | null
  changeRate: number | null
  currency: string | null
  rank: number | null
  score: number | null
  expectedReturn: number | null
  expectedReturnAvailable: boolean | null
  riskLevel: string | null
  modelVersion: string | null
  bundleId: string | null
  modelGeneratedAt: string | null
  modelAsof: string | null
  cacheAgeSec: number | null
  stale: boolean | null
  staleReason: string | null
  advisoryOnly: boolean | null
  safeToEnableOrderActions: boolean | null
  liveTradingAllowed: boolean | null
}

export interface RecommendationSelectionItem {
  recommendationId?: number
  stockCode?: string
}

export type SelectRecommendationRequest =
  | RecommendationSelectionItem
  | {
      selectedRecommendations: RecommendationSelectionItem[]
    }

export interface RecommendationSelectResponse {
  selectedCount: number
  recommendationIds: number[]
  stockCodes: string[]
}

export function getRecommendations() {
  return apiRequest<RecommendationList>('/api/recommendations')
}

export function getRecommendationDetail(recommendationId: number | string) {
  return apiRequest<RecommendationDetail>(
    `/api/recommendations/${encodeURIComponent(String(recommendationId))}`,
  )
}

export function getRecommendationReasons(stockCode: string) {
  return apiRequest<RecommendationDetail>(
    `/api/recommendations/${encodeURIComponent(stockCode)}/reasons`,
  )
}

export function selectRecommendations(payload: SelectRecommendationRequest) {
  return apiRequest<RecommendationSelectResponse>('/api/recommendations/select', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
