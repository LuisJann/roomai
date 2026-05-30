import { NextResponse } from "next/server";
import os from "os";
import { createSession } from "@/lib/sessionDb";

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  createSession(sessionId);

  // Find the first IPv4 non-internal interface
  let macIp = "localhost";
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        macIp = net.address;
        break;
      }
    }
  }

  return NextResponse.json({ sessionId, macIp });
}
