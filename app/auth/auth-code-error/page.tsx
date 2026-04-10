import Link from "next/link";
import { Zap, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] text-zinc-950 flex flex-col">
      {/* Subtle grid */}
      <div className="pointer-events-none fixed inset-0 opacity-50 grid-paper-bg" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#FFFBF0]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 bg-amber-400 rounded-lg border border-zinc-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Zap size={15} fill="currentColor" className="text-zinc-950" />
            </span>
            <span className="font-black text-[1.05rem] tracking-tight">Whybug</span>
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-950/[0.03] text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>

          <h1 className="font-black text-[1.4rem] tracking-tight text-zinc-950">
            Couldn&apos;t sign you in
          </h1>
          <p className="mt-2 text-[0.88rem] text-zinc-500 leading-relaxed">
            The sign-in link may have expired or already been used. Please try again from the sign-in page.
          </p>

          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-[46px] w-full items-center justify-center rounded-xl bg-zinc-950 text-[0.88rem] font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-[0.99] transition-all"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
