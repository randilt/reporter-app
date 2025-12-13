import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint for syncing incident reports
 * Proxies requests to the actual backend API
 *
 * Backend API: https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/report/initiate
 */

const BACKEND_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/report/initiate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the received report for debugging
    console.log("[API] Proxying sync request to backend:", {
      reportId: body.localId,
      incidentType: body.incidentType,
      severity: body.severity,
      responder: body.responderInfo
        ? {
            name: body.responderInfo.name,
            phone: body.responderInfo.phone,
            responderId: body.responderInfo.responderId,
          }
        : null,
      locationAtCreation: body.locationCapturedAtCreation,
      locationAtSync: body.locationCapturedAtSync,
      userCreatedAt: body.createdAtLocal,
    });

    // Validate required fields
    if (!body.localId || !body.incidentType || !body.severity) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Forward the request to the actual backend API
    const backendResponse = await fetch(BACKEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Get the response from backend
    const backendData = await backendResponse.json();

    // Log backend response
    console.log("[API] Backend response:", {
      status: backendResponse.status,
      data: backendData,
    });

    // If backend request failed, return error
    if (!backendResponse.ok) {
      console.error("[API] Backend API error:", {
        status: backendResponse.status,
        data: backendData,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            backendData.error || backendData.message || "Backend API error",
          details: backendData,
        },
        { status: backendResponse.status }
      );
    }

    // Return backend response to client
    // Normalize the response to maintain compatibility with existing client code
    return NextResponse.json(
      {
        success: true,
        data: {
          ...backendData,
          // Ensure localId is present for client tracking
          localId: body.localId,
          // Add synced timestamp if not provided by backend
          syncedAt: backendData.syncedAt || new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[API] Proxy error:", error);

    // Check if it's a network error
    const isNetworkError =
      error instanceof TypeError && error.message.includes("fetch");

    return NextResponse.json(
      {
        success: false,
        error: isNetworkError
          ? "Failed to connect to backend API"
          : "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
