import { NextResponse } from "next/server";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { normalizeEmail } from "@/lib/auth/otp";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isReportStatus } from "@/lib/reports/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    .select("*")
    .eq("id", id)
    .eq("owner_email", owner)
    .maybeSingle();

  if (error) {
    console.error("[reports GET id]", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status =
    typeof body === "object" &&
      body !== null &&
      "status" in body &&
      typeof (body as { status: unknown }).status === "string"
      ? (body as { status: string }).status
      : "";

  if (!isReportStatus(status)) {
    return NextResponse.json(
      { error: "Invalid status (use new, resolved, or archived)" },
      { status: 400 }
    );
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
    .update({ status })
    .eq("id", id)
    .eq("owner_email", owner)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[reports PATCH]", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ report: data });
}
