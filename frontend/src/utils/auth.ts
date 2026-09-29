const TOKEN_KEY = 'triangle_token'
const USER_KEY = 'triangle_user'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export const setAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const isAuthenticated = (): boolean => !!getToken()
