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

export interface UserIdResponse {
  userId: number
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

export function logoutApi() {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export function withdrawUser() {
  return apiRequest<void>('/api/users/me/withdraw', { method: 'POST' })
}
