import { NextResponse } from "next/server";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { normalizeEmail } from "@/lib/auth/otp";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = normalizeEmail(user.email);
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("id, project_id, user_message, status, created_at, user_data")
    .eq("owner_email", owner)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[reports GET]", error);
    const missing =
      error.code === "42P01" ||
      /relation|does not exist|schema cache/i.test(String(error.message ?? ""));
    return NextResponse.json(
      {
        error: missing
          ? "Reports table missing. Run supabase/migrations/20260410120000_reports.sql in Supabase."
          : "Failed to load reports",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ reports: data ?? [] });
}
