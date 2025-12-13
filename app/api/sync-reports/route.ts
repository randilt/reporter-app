import { NextRequest, NextResponse } from "next/server";

/**
 * Mock API endpoint for syncing incident reports
 * This simulates a backend API that would process and store reports
 *
 * TO REPLACE WITH REAL API:
 * 1. Update the endpoint URL in lib/api-client.ts
 * 2. Add authentication headers if needed
 * 3. Update the response structure to match your backend
 * 4. Handle error responses appropriately
 */
export async function POST(request: NextRequest) {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const body = await request.json();

    // Log the received report for debugging
    console.log("[API] Received sync request:", {
      reportId: body.localId,
      incidentType: body.incidentType,
      severity: body.severity,
      timestamp: new Date().toISOString(),
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

    // Simulate random failure for testing (5% chance)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        {
          success: false,
          error: "Simulated server error",
        },
        { status: 500 }
      );
    }

    // Mock successful response
    // In production, this would be the server-generated ID
    const serverId = `srv_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          serverId,
          localId: body.localId,
          syncedAt: new Date().toISOString(),
          message: "Report synced successfully",
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
    console.error("[API] Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
