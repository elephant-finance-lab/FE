import { clearAccessToken, getAccessToken, setAccessToken } from './authStorage'

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

export interface ApiResponse<T> {
  isSuccess: boolean
  code: string
  message: string
  result: T
}

interface TokenResponse {
  accessToken: string
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

async function readApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? ((await response.json()) as ApiResponse<T>)
    : null

  if (!response.ok || body?.isSuccess === false) {
    throw new ApiError(
      body?.message ?? '요청 처리에 실패했습니다.',
      response.status,
      body?.code,
    )
  }

  return body?.result as T
}

let reissuePromise: Promise<string | null> | null = null

export async function reissueAccessToken() {
  if (!reissuePromise) {
    reissuePromise = fetch(buildApiUrl('/api/auth/token'), {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        const result = await readApiResponse<TokenResponse>(response)
        setAccessToken(result.accessToken)
        return result.accessToken
      })
      .catch(() => {
        clearAccessToken()
        return null
      })
      .finally(() => {
        reissuePromise = null
      })
  }

  return reissuePromise
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retryOnUnauthorized = true) {
  const headers = new Headers(init.headers)
  const token = getAccessToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && retryOnUnauthorized) {
    const nextToken = await reissueAccessToken()
    if (nextToken) {
      return apiRequest<T>(path, init, false)
    }
  }

  return readApiResponse<T>(response)
}
