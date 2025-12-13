import { NextResponse } from "next/server";
import { getIdToken } from "@/lib/auth-server";

const EXTERNAL_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/report";

export async function GET() {
  try {
    // Get idToken from cookies for authorization
    const idToken = await getIdToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if idToken is available
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const response = await fetch(EXTERNAL_API_URL, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch reports";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
