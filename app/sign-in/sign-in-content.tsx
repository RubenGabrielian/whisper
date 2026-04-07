"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Zap, ArrowLeft } from "lucide-react";
import { startGoogleSignIn } from "@/lib/auth/google-oauth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
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
        if (!cancelled && d.ok) {
          router.replace(nextPath);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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
    if (!trimmed) {
      setFormError("Enter your email address.");
      return;
    }
    setEmailLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setEmailLoading(false);
    if (!res.ok) {
      setFormError(data.error ?? "Could not send code.");
      return;
    }
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const code = otp.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifyLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setVerifyLoading(false);
    if (!res.ok) {
      setFormError(data.error ?? "Verification failed.");
      return;
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background — matches landing hero feel */}
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
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={14} aria-hidden />
            Home
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-4 py-14 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Zap className="h-7 w-7 text-cyan-600" fill="currentColor" />
            </div>
            <p className="mb-2 inline-flex items-center gap-2 text-[0.7rem] font-mono font-semibold uppercase tracking-[0.14em] text-cyan-600">
              <span className="h-px w-4 bg-cyan-500/50" />
              Sign in
              <span className="h-px w-4 bg-cyan-500/50" />
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
              Welcome back
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
              Use Google or a one-time code sent to your email.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            {showAuthError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
              >
                Google sign-in didn&apos;t complete. Try again.
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full gap-3 rounded-xl border-slate-200 bg-white text-[0.9375rem] font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  onClick={signInWithGoogle}
                  disabled={googleLoading || emailLoading}
                >
                  <GoogleIcon className="h-5 w-5 shrink-0" />
                  {googleLoading ? "Opening Google…" : "Continue with Google"}
                </Button>

                {supabaseGoogleRedirectUri && (
                  <details className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-left text-[0.7rem] leading-relaxed text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-700">
                      Google error: redirect_uri_mismatch?
                    </summary>
                    <p className="mt-2">
                      In{" "}
                      <strong className="text-slate-800">Google Cloud Console</strong> → APIs
                      &amp; Services → Credentials → your OAuth 2.0 Client →{" "}
                      <strong>Authorized redirect URIs</strong>, add exactly:
                    </p>
                    <code className="mt-1.5 block break-all rounded border border-slate-200 bg-white px-2 py-1.5 font-mono text-[0.65rem] text-slate-900">
                      {supabaseGoogleRedirectUri}
                    </code>
                    <p className="mt-2 text-slate-500">
                      Do not put <code className="text-slate-700">localhost</code> here — Google
                      sends users back to Supabase at this URL, then Supabase redirects to your app.
                    </p>
                  </details>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="bg-white px-3">or email</span>
                  </div>
                </div>

                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="sign-in-email"
                      className="text-sm font-medium text-slate-800"
                    >
                      Work email
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <Input
                        id="sign-in-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-11 pr-4 text-slate-900 placeholder:text-slate-400"
                        disabled={googleLoading || emailLoading}
                      />
                    </div>
                  </div>
                  {formError && (
                    <p role="alert" className="text-sm text-red-600">
                      {formError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-cyan-600 text-[0.9375rem] font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500"
                    disabled={googleLoading || emailLoading}
                  >
                    {emailLoading ? "Sending code…" : "Email me a code"}
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-800">Enter your code</p>
                  <p className="mt-1 text-sm text-slate-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-slate-800">{email.trim()}</span>
                  </p>
                </div>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 rounded-xl border-slate-200 bg-slate-50 text-center font-mono text-2xl tracking-[0.35em] text-slate-900"
                  maxLength={6}
                />
                {formError && (
                  <p role="alert" className="text-center text-sm text-red-600">
                    {formError}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-200"
                    onClick={resetOtpFlow}
                    disabled={verifyLoading}
                  >
                    Change email
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? "Verifying…" : "Verify & continue"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
            By continuing you agree to our terms and privacy policy. Check your spam folder if
            the code doesn&apos;t arrive within a minute.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
