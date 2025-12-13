/**
 * Server-side authentication utilities
 * For use in API routes and Server Components
 */

import { cookies } from "next/headers";

/**
 * Get idToken from request cookies (server-side)
 */
export async function getIdToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const idToken = cookieStore.get("idToken");
  return idToken?.value ?? null;
}

/**
 * Get accessToken from request cookies (server-side)
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  return accessToken?.value ?? null;
}

/**
 * Get refreshToken from request cookies (server-side)
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");
  return refreshToken?.value ?? null;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  const accessToken = await getAccessToken();
  return accessToken !== null;
}

/**
 * Get all auth tokens (server-side)
 */
export async function getAuthTokens(): Promise<{
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}> {
  return {
    idToken: await getIdToken(),
    accessToken: await getAccessToken(),
    refreshToken: await getRefreshToken(),
  };
}
