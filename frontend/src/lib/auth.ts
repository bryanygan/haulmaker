const TOKEN_KEY = "haulmaker_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Check the JWT exp claim so an expired token doesn't pass the auth guard
  try {
    const payloadBase64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      clearToken();
      return false;
    }
  } catch {
    // Malformed token — treat as unauthenticated
    clearToken();
    return false;
  }

  return true;
}
