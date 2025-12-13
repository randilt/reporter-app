/**
 * Authentication utilities for handling tokens
 */

/**
 * Get idToken from cookies (client-side)
 * Note: This only works for non-httpOnly cookies
 */
export function getIdTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "idToken") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get accessToken from cookies (client-side)
 * Note: This only works for non-httpOnly cookies
 */
export function getAccessTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Clear all auth tokens (logout)
 */
export function clearAuthTokens(): void {
  if (typeof document === "undefined") return;

  // Set cookies to expire immediately
  document.cookie = "idToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

/**
 * Check if user is authenticated by checking for tokens
 */
export function isAuthenticated(): boolean {
  return getAccessTokenFromCookies() !== null;
}
