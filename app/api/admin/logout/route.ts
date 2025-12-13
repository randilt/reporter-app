import { NextResponse } from "next/server";

/**
 * API endpoint for logging out admin users
 * Clears authentication cookies
 */

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear all authentication cookies
    response.cookies.delete("idToken");
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    console.error("[Logout API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}
