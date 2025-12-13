import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/verify-token";

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = ["/dashboard", "/admin"];

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/admin/login"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.includes(route)
  );
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.endsWith(route)
  );

  // Check for authentication on protected routes
  if (isProtectedRoute && !isPublicRoute) {
    // Get idToken from cookies
    const idToken = request.cookies.get("idToken")?.value;

    if (!idToken) {
      // No token found, redirect to login
      const locale = pathname.split("/")[1]; // Extract locale from path
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the token
      await verifyIdToken(idToken);
      // Token is valid, continue with i18n middleware
    } catch (error) {
      // Token is invalid or expired, redirect to login
      console.error("[Middleware] Token verification failed:", error);

      const locale = pathname.split("/")[1]; // Extract locale from path
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      const response = NextResponse.redirect(loginUrl);

      // Clear invalid tokens
      response.cookies.delete("idToken");
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");

      return response;
    }
  }

  // Continue with i18n middleware for all routes
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
