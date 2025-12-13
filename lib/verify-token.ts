/**
 * JWT Token Verification for AWS Cognito
 * Server-side only - for use in middleware and API routes
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";
import { cognitoConfig } from "./cognito-config";

// Create verifier for ID tokens
const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: cognitoConfig.userPoolId,
  tokenUse: "id",
  clientId: cognitoConfig.clientId,
});

// Create verifier for Access tokens
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: cognitoConfig.userPoolId,
  tokenUse: "access",
  clientId: cognitoConfig.clientId,
});

export interface CognitoTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  phone_number?: string;
  "cognito:username": string;
  "cognito:groups"?: string[];
  aud?: string;
  token_use: "id" | "access";
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
}

/**
 * Verify Cognito ID Token
 * @param token - The ID token string
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyIdToken(
  token: string
): Promise<CognitoTokenPayload> {
  try {
    const payload = await idTokenVerifier.verify(token);
    return payload as CognitoTokenPayload;
  } catch (error) {
    console.error("[Auth] ID token verification failed:", error);
    throw new Error("Invalid or expired ID token");
  }
}

/**
 * Verify Cognito Access Token
 * @param token - The access token string
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyAccessToken(
  token: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const payload = await accessTokenVerifier.verify(token);
    return payload;
  } catch (error) {
    console.error("[Auth] Access token verification failed:", error);
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify any Cognito token (ID or Access)
 * Automatically detects token type and uses appropriate verifier
 * @param token - The token string
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyCognitoToken(
  token: string
): Promise<CognitoTokenPayload> {
  try {
    // Try ID token first
    return await verifyIdToken(token);
  } catch {
    // Fall back to access token
    return await verifyAccessToken(token);
  }
}

/**
 * Extract user information from verified token
 * @param token - Verified token payload
 * @returns User information object
 */
export function extractUserInfo(token: CognitoTokenPayload) {
  return {
    userId: token.sub,
    username: token["cognito:username"],
    email: token.email,
    emailVerified: token.email_verified,
    name: token.name,
    phoneNumber: token.phone_number,
    groups: token["cognito:groups"] || [],
  };
}
