import { NextRequest, NextResponse } from "next/server";
import { getIdToken } from "@/lib/auth-server";

/**
 * API endpoint for updating safe place status
 * Proxies requests to the actual backend API
 *
 * Backend API: https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone/update
 */

const BACKEND_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/safe-zone/update";

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const id = searchParams.get("id");

    if (!status || !id) {
      return NextResponse.json(
        { error: "Missing required parameters: status and id" },
        { status: 400 }
      );
    }

    // Get the idToken from cookies for authentication
    const idToken = await getIdToken();

    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Forward the request to the backend API

    const response = await fetch(
      `${BACKEND_API_URL}?status=${encodeURIComponent(
        status
      )}&id=${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    // Try to parse JSON only if content-type is application/json and body is not empty
    let data: unknown = {};
    const contentType = response.headers.get("content-type");
    const text = await response.text();
    if (contentType && contentType.includes("application/json") && text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    } else {
      data = text ? { message: text } : {};
    }

    // Helper to extract error/message safely
    const getError = (d: unknown): string => {
      if (d && typeof d === "object") {
        const obj = d as { error?: string; message?: string };
        return obj.error || obj.message || "Failed to update safe place status";
      }
      return "Failed to update safe place status";
    };
    const getMessage = (d: unknown): string => {
      if (d && typeof d === "object") {
        const obj = d as { message?: string };
        return obj.message || "Status updated successfully";
      }
      return "Status updated successfully";
    };

    if (!response.ok) {
      console.error("[API] Backend error:", {
        status: response.status,
        data,
      });
      return NextResponse.json(
        {
          success: false,
          error: getError(data),
        },
        { status: response.status }
      );
    }

    console.log("[API] Safe place status updated successfully:", {
      id,
      status,
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        status,
        message: getMessage(data),
      },
    });
  } catch (error) {
    console.error("[API] Failed to update safe place status:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error while updating safe place status",
      },
      { status: 500 }
    );
  }
}
