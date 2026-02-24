// Persist auth token storage

const TOKEN_KEY = 'auth_token';
const REMEMBER_KEY = 'auth_remember';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, remember: boolean): void {
  // Clear both first
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  if (remember) {
    localStorage.setItem(REMEMBER_KEY, '1');
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
