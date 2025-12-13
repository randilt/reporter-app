import { NextResponse } from "next/server";
import { getIdToken } from "@/lib/auth-server";

/**
 * API endpoint for fetching safe places
 * Proxies requests to the actual backend API
 *
 * Backend API: https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone
 */

const BACKEND_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone";

export async function GET() {
  try {
    // Get the idToken from cookies for authentication
    const idToken = await getIdToken();

    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Forward the request to the backend API
    const response = await fetch(BACKEND_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[API] Backend error:", {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          error: data.error || data.message || "Failed to fetch safe places",
        },
        { status: response.status }
      );
    }

    console.log("[API] Safe places fetched successfully:", {
      count: data.data?.length || 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Failed to fetch safe places:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error while fetching safe places",
      },
      { status: 500 }
    );
  }
}
