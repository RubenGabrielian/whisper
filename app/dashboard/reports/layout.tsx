import Link from "next/link";
import { Zap } from "lucide-react";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b-2 border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 group">
              <span
                className="flex size-8 items-center justify-center border-2 border-zinc-950 bg-amber-400 shadow-[3px_3px_0_0_#000] transition-transform group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-[2px_2px_0_0_#000]"
              >
                <Zap size={15} fill="currentColor" className="text-zinc-950" />
              </span>
              <span className="font-black text-[0.95rem] tracking-tight text-zinc-100">Whybug</span>
            </Link>
            <nav className="hidden items-center gap-2 sm:flex">
              <Link
                href="/dashboard"
                className="rounded-md border-2 border-transparent px-2.5 py-1 text-[0.8rem] font-bold text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Projects
              </Link>
              <span className="rounded-md border-2 border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[0.8rem] font-bold text-amber-400">
                Reports
              </span>
            </nav>
          </div>
          <Link
            href="/dashboard"
            className="text-[0.75rem] font-mono font-bold text-zinc-500 hover:text-amber-400 transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
