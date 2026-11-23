import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    name: "Aivanta API",
    version: "1.0.0",
    status: "online",
    message: "Aivanta's API is running successfully!",
    timestamp: new Date().toISOString(),
  });
}
