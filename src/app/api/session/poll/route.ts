import { NextRequest, NextResponse } from "next/server";

const globalSessions = (global as any).sessions || {};
(global as any).sessions = globalSessions;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const session = globalSessions[sessionId];
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ photos: session.photos });
}
