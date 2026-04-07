import { NextResponse } from "next/server";
import { getDashboardUser } from "@/lib/auth/dashboard-user";

export async function GET() {
  const user = await getDashboardUser();
  return NextResponse.json({ ok: Boolean(user) });
}
