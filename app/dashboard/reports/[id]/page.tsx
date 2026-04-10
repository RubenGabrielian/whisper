import { redirect } from "next/navigation";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { ReportsExplorer } from "@/components/dashboard/ReportsExplorer";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const user = await getDashboardUser();
  const { id } = await Promise.resolve(params);
  if (!user) {
    redirect(`/sign-in?next=/dashboard/reports/${encodeURIComponent(id)}`);
  }
  if (!id || typeof id !== "string") {
    redirect("/dashboard/reports");
  }

  return (
    <main className="mx-auto max-w-[1400px] px-3 pb-10 pt-6 sm:px-6">
      <ReportsExplorer initialReportId={id} />
    </main>
  );
}
