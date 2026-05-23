const ACCESS_TOKEN_KEY = 'elephant_access_token'
const AUTH_REDIRECT_PATH_KEY = 'elephant_auth_redirect_path'

function isInternalPath(path: string | null): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'))
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function saveAuthRedirectPath(path: string) {
  if (isInternalPath(path)) {
    sessionStorage.setItem(AUTH_REDIRECT_PATH_KEY, path)
  }
}

export function takeAuthRedirectPath(defaultPath = '/chart') {
  const savedPath = sessionStorage.getItem(AUTH_REDIRECT_PATH_KEY)
  sessionStorage.removeItem(AUTH_REDIRECT_PATH_KEY)
  return isInternalPath(savedPath) ? savedPath : defaultPath
}
