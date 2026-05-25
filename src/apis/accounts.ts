import { apiRequest } from '../lib/apiClient'

export type AccountType = 'COMPREHENSIVE' | 'SECURITIES'

export interface AccountInfo {
  accountId: number
  bankName: string
  accountNumber: string
  accountHolder: string
  accountType: AccountType
  primary: boolean
  hidden: boolean
  balance: number
  linkedAt: string
}

export interface CreateAccountRequest {
  accountHolder: string
  bankName: string
  accountNumber: string
  accountType: AccountType
}

export interface AccountIdResponse {
  accountId: number
}

export function getAccounts() {
  return apiRequest<AccountInfo[]>('/api/users/accounts')
}

export function createAccount(payload: CreateAccountRequest) {
  return apiRequest<AccountIdResponse>('/api/users/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteAccount(accountId: number) {
  return apiRequest<void>(`/api/users/accounts/${accountId}`, {
    method: 'DELETE',
  })
}
