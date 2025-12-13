/**
 * AWS Cognito Configuration
 */

export const cognitoConfig = {
  userPoolId: process.env.USER_POOL_ID || "ap-southeast-1_DXK9kzoaK",
  clientId: process.env.CLIENT_ID || "37o9vtais59bfm5klsojolqp5o",
  clientSecret:
    process.env.CLIENT_SECRET ||
    "eib8gdj5sg0mb3hhv2qkaka8r2sa7qm4nodh6cvhpmpqk34t04i",
  region: process.env.AWS_REGION || "ap-southeast-1",
};

/**
 * Get Cognito JWKS URL for token verification
 */
export function getCognitoJwksUrl(): string {
  return `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`;
}

/**
 * Get Cognito Issuer for token verification
 */
export function getCognitoIssuer(): string {
  return `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`;
}
