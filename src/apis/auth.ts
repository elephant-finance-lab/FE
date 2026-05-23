import { apiRequest, buildApiUrl } from '../lib/apiClient'

export type SocialProvider = 'google' | 'kakao' | 'naver'

export type Gender = 'MALE' | 'FEMALE'

export interface AuthMeResponse {
  userId: string
  accessToken?: string
}

export interface UserProfile {
  uuid: string
  name: string | null
  phone: string | null
  gender: Gender | null
  avatarUrl: string | null
}

export interface RegisterUserInfoRequest {
  name: string
  phone: string
  accountNumber?: string
  gender: Gender
}

export interface UpdateUserProfileRequest {
  name: string
  phone: string
}

export interface UserIdResponse {
  userId: number
}

export type TermsType = 'INVESTMENT' | 'TRADE_RISK' | 'PRIVACY' | 'SERVICE'

export interface UserTermsItem {
  termsType: TermsType
  agreed: boolean
  agreedAt: string | null
}

export interface UserTermsResponse {
  items: UserTermsItem[]
}

const requiredTerms: TermsType[] = ['INVESTMENT', 'TRADE_RISK', 'PRIVACY', 'SERVICE']

export function hasAgreedAllTerms(terms: UserTermsResponse | null | undefined) {
  return requiredTerms.every((type) =>
    terms?.items?.some((item) => item.termsType === type && item.agreed),
  )
}

export function getOAuthLoginUrl(provider: SocialProvider) {
  return buildApiUrl(`/oauth2/authorization/${provider}`)
}

export function getAuthMe() {
  return apiRequest<AuthMeResponse>('/api/auth/me')
}

export function getMyProfile() {
  return apiRequest<UserProfile>('/api/users/me')
}

export function registerUserInfo(payload: RegisterUserInfoRequest) {
  return apiRequest<UserIdResponse>('/api/users/me', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUserProfile(payload: UpdateUserProfileRequest) {
  return apiRequest<void>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getMyTerms() {
  return apiRequest<UserTermsResponse>('/api/users/me/terms')
}

export function agreeAllTerms() {
  return apiRequest<void>('/api/users/me/terms', {
    method: 'POST',
    body: JSON.stringify({ agreeAll: true }),
  })
}

export function logoutApi() {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export function withdrawUser() {
  return apiRequest<void>('/api/users/me/withdraw', { method: 'POST' })
}
