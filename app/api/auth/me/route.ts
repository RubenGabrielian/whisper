import { NextResponse } from "next/server";
import { getDashboardUser } from "@/lib/auth/dashboard-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      email: user.email,
      name: user.source === "google" ? (user as { name?: string | null }).name : null,
    },
  });
}
