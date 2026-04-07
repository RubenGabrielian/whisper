import { NextResponse } from "next/server";
import { buildWhisperSdkScript } from "@/lib/embed/whisper-sdk";

export const runtime = "nodejs";

/**
 * Serves the Whisper embed script for `<script src="…/api/embed/sdk">`.
 * Uses the request origin so the widget posts back to the same deployment.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const body = buildWhisperSdkScript(origin);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
