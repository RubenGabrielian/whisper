"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Zap, ArrowLeft, Lock } from "lucide-react";
import { startGoogleSignIn } from "@/lib/auth/google-oauth";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const rawNext = searchParams.get("next");
  const nextPath =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { ok?: boolean }) => {
        if (!cancelled && d.ok) router.replace(nextPath);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [router, nextPath]);

  async function signInWithGoogle() {
    setFormError(null);
    setGoogleLoading(true);
    const { error: oauthError } = await startGoogleSignIn(nextPath);
    setGoogleLoading(false);
    if (oauthError) setFormError(oauthError);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed) { setFormError("Enter your email address."); return; }
    setEmailLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setEmailLoading(false);
    if (!res.ok) { setFormError(data.error ?? "Could not send code."); return; }
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const code = otp.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) { setFormError("Enter the 6-digit code from your email."); return; }
    setVerifyLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setVerifyLoading(false);
    if (!res.ok) { setFormError(data.error ?? "Verification failed."); return; }
    router.push(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  function resetOtpFlow() {
    setOtpSent(false);
    setOtp("");
    setFormError(null);
  }

  const showAuthError = urlError === "auth";

  const supabaseGoogleRedirectUri =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/callback`
      : null;

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-zinc-950">
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
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft size={14} aria-hidden />
            Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-[420px] flex-col items-center px-5 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 border border-amber-500/30 shadow-lg shadow-amber-400/20">
              <Zap className="h-7 w-7 text-zinc-950" fill="currentColor" />
            </div>
            <h1 className="font-black text-[1.85rem] tracking-tight text-zinc-950">
              Welcome back
            </h1>
            <p className="mt-1.5 text-[0.88rem] text-zinc-500 leading-relaxed">
              Sign in with Google or a one-time email code.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xl shadow-zinc-950/[0.03]">
            {showAuthError && (
              <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[0.82rem] font-medium text-red-700">
                Google sign-in didn&apos;t complete. Try again.
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-5">
                {/* Google button */}
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={googleLoading || emailLoading}
                  className="relative h-[46px] w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white text-[0.9rem] font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
                  {googleLoading ? "Opening Google..." : "Continue with Google"}
                </button>

                {supabaseGoogleRedirectUri && (
                  <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left text-[0.72rem] leading-relaxed text-zinc-500">
                    <summary className="cursor-pointer font-semibold text-zinc-600">
                      Google error: redirect_uri_mismatch?
                    </summary>
                    <p className="mt-2">
                      In <strong className="text-zinc-800">Google Cloud Console</strong> &rarr; APIs &amp; Services &rarr; Credentials &rarr; your OAuth 2.0 Client &rarr; <strong>Authorized redirect URIs</strong>, add exactly:
                    </p>
                    <code className="mt-1.5 block break-all rounded-lg border border-zinc-200 bg-white px-2.5 py-2 font-mono text-[0.65rem] text-zinc-800">{supabaseGoogleRedirectUri}</code>
                  </details>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <span className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[0.7rem] font-semibold uppercase tracking-widest text-zinc-400">or</span>
                  </div>
                </div>

                {/* Email form */}
                <form onSubmit={handleSendCode} className="space-y-3.5">
                  <div>
                    <label htmlFor="sign-in-email" className="block text-[0.8rem] font-semibold text-zinc-700 mb-1.5">
                      Work email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-zinc-400" strokeWidth={2} aria-hidden />
                      <input
                        id="sign-in-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-[46px] w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 text-[0.88rem] text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all disabled:opacity-50"
                        disabled={googleLoading || emailLoading}
                      />
                    </div>
                  </div>
                  {formError && (
                    <p role="alert" className="text-[0.8rem] font-medium text-red-600">{formError}</p>
                  )}
                  <button
                    type="submit"
                    className="h-[46px] w-full rounded-xl bg-zinc-950 text-[0.88rem] font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={googleLoading || emailLoading}
                  >
                    {emailLoading ? "Sending code..." : "Email me a code"}
                  </button>
                </form>
              </div>
            ) : (
              /* OTP step */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 border border-amber-200">
                    <Lock size={18} className="text-amber-700" />
                  </div>
                  <p className="text-[0.92rem] font-bold text-zinc-900">Check your inbox</p>
                  <p className="mt-1 text-[0.82rem] text-zinc-500">
                    We sent a 6-digit code to <span className="font-semibold text-zinc-800">{email.trim()}</span>
                  </p>
                </div>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 text-center font-mono text-[1.6rem] tracking-[0.4em] text-zinc-900 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  maxLength={6}
                />
                {formError && (
                  <p role="alert" className="text-center text-[0.8rem] font-medium text-red-600">{formError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetOtpFlow}
                    disabled={verifyLoading}
                    className="flex-1 h-[44px] rounded-xl border border-zinc-200 bg-white text-[0.85rem] font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Change email
                  </button>
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="flex-1 h-[44px] rounded-xl bg-zinc-950 text-[0.85rem] font-semibold text-white hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {verifyLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-[0.72rem] text-zinc-400 leading-relaxed">
            By continuing you agree to our terms and privacy policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
