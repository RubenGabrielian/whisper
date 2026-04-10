import Link from "next/link";
import { Zap } from "lucide-react";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex size-8 items-center justify-center rounded-lg border-2 border-zinc-900 bg-amber-400 shadow-[3px_3px_0_0_#18181b] transition-transform group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-[2px_2px_0_0_#18181b]">
                <Zap size={15} fill="currentColor" className="text-zinc-900" />
              </span>
              <span className="font-bold text-[0.95rem] tracking-tight text-zinc-900">Whybug</span>
            </Link>
            <nav className="hidden items-center gap-2 sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                Projects
              </Link>
              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-[0.8rem] font-medium text-zinc-900">
                Reports
              </span>
            </nav>
          </div>
          <Link
            href="/dashboard"
            className="text-[0.75rem] font-mono font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
