import { redirect } from "next/navigation";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { ReportsExplorer } from "@/components/dashboard/ReportsExplorer";

export default async function ReportsPage() {
  const user = await getDashboardUser();
  if (!user) {
    redirect("/sign-in?next=/dashboard/reports");
  }

  return (
    <main className="mx-auto max-w-[1400px] px-3 pb-10 pt-6 sm:px-6">
      <ReportsExplorer />
    </main>
  );
}
