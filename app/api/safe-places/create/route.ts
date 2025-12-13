import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint for creating safe place markers
 * Proxies requests to the actual backend API
 * This is an open endpoint (no authentication required)
 *
 * Backend API: https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone/create
 */

const BACKEND_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone/create";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the received safe place data for debugging
    console.log("[API] Creating safe place:", {
      localId: body.localId,
      location: body.location,
      amenitiesCount: Object.values(body.amenities || {}).filter(Boolean)
        .length,
    });

    // Forward the request to the backend API (open endpoint, no auth required)
    const response = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[API] Backend error:", {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || "Failed to create safe place",
        },
        { status: response.status }
      );
    }

    console.log("[API] Safe place created successfully:", {
      localId: body.localId,
      serverId: data.serverId || data.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        serverId: data.serverId || data.id,
        localId: body.localId,
        createdAt: data.createdAt || new Date().toISOString(),
        message: data.message || "Safe place marked successfully",
      },
    });
  } catch (error) {
    console.error("[API] Failed to create safe place:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error while creating safe place",
      },
      { status: 500 }
    );
  }
}
