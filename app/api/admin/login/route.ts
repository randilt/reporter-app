import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_LOGIN_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/admin/login";

interface LoginResponse {
  data?: {
    data?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
      expiresIn?: number;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const upstreamResp = await fetch(EXTERNAL_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: email, password }),
    });

    const text = await upstreamResp.text();

    // Try to parse JSON if possible
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!upstreamResp.ok) {
      return NextResponse.json(
        { error: data ?? "Login failed", status: upstreamResp.status },
        { status: upstreamResp.status }
      );
    }

    // Extract tokens from the backend response
    const payload = data as LoginResponse;
    const accessToken = payload?.data?.data?.accessToken;
    const refreshToken = payload?.data?.data?.refreshToken;
    const idToken = payload?.data?.data?.idToken;
    const expiresIn = payload?.data?.data?.expiresIn ?? 3600; // seconds

    const response = NextResponse.json(data);

    if (accessToken) {
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn,
      });
    }

    if (idToken) {
      response.cookies.set("idToken", idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expiresIn,
      });
    }

    if (refreshToken) {
      // Default to 30 days if backend does not supply
      const refreshMaxAge = 30 * 24 * 60 * 60;
      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: refreshMaxAge,
      });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
