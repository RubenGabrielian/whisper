import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { getAppOriginFromHeaders } from "@/lib/app-url";
import { ArrowLeft, Zap } from "lucide-react";
import { ProjectCreation } from "@/components/dashboard/ProjectCreation";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await getDashboardUser();
  if (!user) {
    redirect("/sign-in?next=/dashboard");
  }

  const appOrigin = getAppOriginFromHeaders();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_-5%,rgba(8,145,178,0.08)_0%,transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-cyan-600 transition-transform group-hover:scale-110">
              <Zap size={14} fill="currentColor" />
            </span>
            <span className="font-bold text-[1.05rem] tracking-tight text-slate-900">
              Whisper
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-flex"
            >
              <ArrowLeft size={14} aria-hidden />
              Home
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <p className="mb-1 text-xs font-mono font-semibold uppercase tracking-[0.14em] text-cyan-600">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          You&apos;re signed in
        </h1>
        <p className="mt-3 text-slate-600">
          Signed in as{" "}
          <span className="font-medium text-slate-900">{user.email}</span>
          {user.source === "google" && (
            <span className="ml-2 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-800 ring-1 ring-cyan-500/20">
              Google
            </span>
          )}
          {user.source === "email_otp" && (
            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
              Email code
            </span>
          )}
        </p>
        {user.source === "google" && user.name && (
          <p className="mt-2 text-sm text-slate-500">{user.name}</p>
        )}

        <div className="mt-10">
          <ProjectCreation appOrigin={appOrigin} />
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex text-sm font-semibold text-cyan-600 hover:text-cyan-500"
        >
          ← Back to marketing site
        </Link>
      </main>
    </div>
  );
}
