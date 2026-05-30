import { NextRequest, NextResponse } from "next/server";
import { getSession, addPhotoToSession } from "@/lib/sessionDb";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const { id, image, name, size } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    // Accept frontend ID or generate new
    const photoId = id || Math.random().toString(36).substring(2, 9);
    const photo = {
      id: photoId,
      name: name || `iphone-photo-${photoId}.jpg`,
      url: image, // Store the base64 URL directly
      size: size || "1.2 MB",
      uploadedAt: Date.now()
    };
    addPhotoToSession(sessionId, photo);

    return NextResponse.json({ success: true, photoId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to parse upload request: " + error.message }, { status: 500 });
  }
}