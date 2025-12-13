import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_API_URL =
  "https://wpdut9liq3.execute-api.ap-southeast-1.amazonaws.com/report/update";

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const localId = searchParams.get("localId");
    const status = searchParams.get("status");

    if (!serverId || !localId || !status) {
      return NextResponse.json(
        { error: "Missing serverId, localId or status" },
        { status: 400 }
      );
    }

    const targetUrl = `${EXTERNAL_API_URL}?serverId=${encodeURIComponent(
      serverId
    )}&localId=${encodeURIComponent(localId)}&status=${encodeURIComponent(
      status
    )}`;

    const resp = await fetch(targetUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    const body = await resp.text();

    if (!resp.ok) {
      return NextResponse.json(
        { error: body || `Upstream error ${resp.status}` },
        { status: resp.status }
      );
    }

    // Try parse JSON, or return raw text
    try {
      const json = JSON.parse(body);
      return NextResponse.json(json);
    } catch {
      return new NextResponse(body, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
