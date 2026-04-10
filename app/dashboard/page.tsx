import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { getAppOriginFromHeaders } from "@/lib/app-url";
import { Zap } from "lucide-react";
import { ProjectCreation } from "@/components/dashboard/ProjectCreation";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await getDashboardUser();
  if (!user) {
    redirect("/sign-in?next=/dashboard");
  }

  const appOrigin = getAppOriginFromHeaders();

  const displayName = user.source === "google" && "name" in user ? (user as { name?: string }).name : undefined;
  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-14 max-w-[1140px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 shadow-sm group-hover:bg-zinc-800 transition-colors">
                <Zap size={13} fill="currentColor" className="text-white" />
              </span>
              <span className="font-bold text-[0.92rem] tracking-tight text-zinc-900">Whybug</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[0.8rem] font-medium text-zinc-900">
                Projects
              </span>
              <Link
                href="/dashboard/reports"
                className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex size-7 items-center justify-center rounded-full bg-zinc-900 text-[0.65rem] font-bold text-white">
                {initials}
              </div>
              <span className="max-w-[180px] truncate text-[0.8rem] text-zinc-600">
                {user.email}
              </span>
            </div>
            <div className="h-5 w-px bg-zinc-200 hidden sm:block" />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1140px] px-6 py-8">
        <ProjectCreation appOrigin={appOrigin} />
      </main>
    </div>
  );
}
