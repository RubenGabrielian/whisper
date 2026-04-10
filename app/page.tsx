"use client";

import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Zap, ArrowRight, Check, X, ChevronDown,
  Clock, FileText, MessageSquare, GitBranch,
  Terminal, Network, Package, User,
  MousePointer2, Shield, Gauge, Star,
} from "lucide-react";
import dynamic from "next/dynamic";

// These sections depend heavily on client-only signals (motion, viewport, UA snapshot).
// Disable SSR to avoid hydration mismatches.
const DemoSection = dynamic(() => import("./components/DemoSection"), { ssr: false });
const WhisperWidgetDemo = dynamic(() => import("./components/WhisperWidgetDemo"), { ssr: false });

/* ═══════════════════════════════════════════════════════
   MOTION VARIANTS
═══════════════════════════════════════════════════════ */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/* ═══════════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════════ */
function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  return (
    <motion.section
      ref={ref} id={id}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp}
      className="inline-flex items-center gap-2 text-[0.68rem] font-mono font-bold
                 text-amber-700 tracking-[0.18em] uppercase mb-4">
      <span className="w-5 h-[2px] bg-amber-600" />
      {children}
      <span className="w-5 h-[2px] bg-amber-600" />
    </motion.div>
  );
}

function Divider() {
  return (
    <div className="w-full h-[2px] bg-zinc-950" />
  );
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features",     href: "#features"     },
  { label: "Demo",         href: "#demo"          },
  { label: "Pricing",      href: "#pricing"       },
  { label: "FAQ",          href: "#faq"           },
];

function Navbar() {
  const scrolled = useScrolled();
  const [authUser, setAuthUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        setAuthUser(data.user ?? null);
        setAuthLoaded(true);
      })
      .catch(() => setAuthLoaded(true));
  }, []);

  const displayName = authUser?.name || authUser?.email?.split("@")[0] || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-150 ${
        scrolled
          ? "border-b-2 border-zinc-950 bg-[#FFFBF0]/95 backdrop-blur-md shadow-[0_4px_0px_0px_rgba(0,0,0,0.15)]"
          : "border-b-2 border-transparent bg-[#FFFBF0]/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="w-7 h-7 flex items-center justify-center border-2 border-zinc-950
                           bg-amber-400 text-zinc-950
                           shadow-[3px_3px_0px_0px_#000]
                           group-hover:shadow-[2px_2px_0px_0px_#000]
                           group-hover:translate-x-[1px] group-hover:translate-y-[1px]
                           transition-[transform,box-shadow] duration-75">
            <Zap size={13} fill="currentColor" />
          </span>
          <span className="font-black text-[1.1rem] text-zinc-950 tracking-tight">
            Whybug
          </span>
        </a>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className="text-[0.78rem] font-mono font-semibold text-zinc-600
                         hover:text-zinc-950 transition-colors duration-100 border-b-2 border-transparent hover:border-amber-400">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {authLoaded && authUser ? (
            <>
              {/* Logged-in user */}
              <div className="hidden md:flex items-center gap-2.5">
                <span className="w-7 h-7 flex items-center justify-center border-2 border-zinc-950
                                 bg-zinc-950 text-white text-[0.6rem] font-black
                                 shadow-[2px_2px_0px_0px_#000]">
                  {initials}
                </span>
                <span className="text-[0.78rem] font-mono font-semibold text-zinc-700 max-w-[140px] truncate">
                  {authUser.name || authUser.email}
                </span>
              </div>
              <motion.a href="/dashboard"
                whileTap={{ x: 2, y: 2 }}
                className="text-[0.78rem] font-black px-4 py-2
                           bg-amber-400 text-zinc-950 border-2 border-zinc-950
                           shadow-[4px_4px_0px_0px_#000]
                           hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]
                           transition-[transform,box-shadow] duration-75">
                Go to Dashboard
              </motion.a>
            </>
          ) : (
            <>
              {/* Not logged in or still loading */}
              <a href="/sign-in" className={`hidden md:block text-[0.78rem] font-mono font-semibold text-zinc-600 hover:text-zinc-950 transition-colors ${!authLoaded ? "opacity-0" : ""}`}>
                Sign in
              </a>
              <motion.a href="#pricing"
                whileTap={{ x: 2, y: 2 }}
                className={`text-[0.78rem] font-black px-4 py-2
                           bg-amber-400 text-zinc-950 border-2 border-zinc-950
                           shadow-[4px_4px_0px_0px_#000]
                           hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]
                           transition-[transform,box-shadow] duration-75 ${!authLoaded ? "opacity-0" : ""}`}>
                Get Started Free
              </motion.a>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center
                        justify-center pt-24 pb-20 px-6 overflow-hidden">
      {/* Grid paper background */}
      <div className="absolute inset-0 grid-paper-bg" aria-hidden />
      {/* Amber glow */}
      <div className="absolute top-0 inset-x-0 h-[50vh] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 65%)" }}
        aria-hidden />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 mb-8
                     border-2 border-zinc-950 bg-amber-400
                     text-zinc-950 text-[0.65rem] font-mono font-black tracking-[0.15em] uppercase
                     shadow-[4px_4px_0px_0px_#000]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full bg-zinc-950 opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-zinc-950" />
          </span>
          PUBLIC BETA · FREE TO START · NO CREDIT CARD
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="font-black text-[clamp(2.8rem,7vw,5.6rem)] leading-[1.0]
                     tracking-tight text-zinc-950 mb-6"
        >
          Stop playing detective
          <br />
          <span className="text-gradient-amber">
            with your bug reports.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3 }}
          className="text-[1.05rem] font-mono text-zinc-600 leading-relaxed max-w-xl mx-auto mb-10"
        >
          Whybug captures the last 30 seconds of user actions, console logs, and network
          errors{" "}
          <span className="text-zinc-950 font-bold">automatically</span>.
          No more back-and-forth emails. Just pure context.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
        >
          <motion.a href="#pricing"
            whileTap={{ x: 2, y: 2 }}
            className="group flex items-center gap-2.5 px-7 py-3.5
                       bg-amber-400 text-zinc-950 font-black text-[0.92rem] tracking-tight
                       border-2 border-zinc-950
                       shadow-[6px_6px_0px_0px_#000]
                       hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px]
                       transition-[transform,box-shadow] duration-75">
            Get Started for Free
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </motion.a>
          <a href="#demo"
            className="flex items-center gap-2 px-6 py-3.5
                       border-2 border-zinc-950 bg-white text-zinc-950 text-[0.88rem] font-black
                       shadow-[6px_6px_0px_0px_#000]
                       hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px]
                       transition-[transform,box-shadow] duration-75">
            See it in action
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.58 }}
          className="flex items-center justify-center gap-2"
        >
          <div className="flex -space-x-2">
            {["#d97706", "#10b981", "#f59e0b", "#a78bfa", "#f472b6"].map((c, i) => (
              <div key={i}
                className="w-6 h-6 border-2 border-zinc-950 flex items-center justify-center
                           text-[0.5rem] font-black text-white"
                style={{ background: c, zIndex: 5 - i }}>
                {["RG", "TM", "PK", "SL", "AJ"][i]}
              </div>
            ))}
          </div>
          <p className="text-[0.78rem] font-mono text-zinc-600">
            Used by <span className="text-zinc-950 font-bold">indie hackers</span> to fix bugs{" "}
            <span className="text-amber-700 font-bold">10× faster</span>
          </p>
        </motion.div>

        {/* Hero terminal — OS window style */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="border-2 border-zinc-950 bg-zinc-950 overflow-hidden
                          shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)]">
            {/* OS window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-zinc-800 bg-zinc-900">
              <span className="w-3 h-3 border border-red-700 bg-[#FF5F57]" />
              <span className="w-3 h-3 border border-yellow-700 bg-[#FFBD2E]" />
              <span className="w-3 h-3 border border-green-700 bg-[#28C840]" />
              <span className="ml-3 text-[0.62rem] font-mono text-zinc-500 tracking-widest uppercase">
                WHISPER · REPORT #1024 · 2 SECONDS TO DIAGNOSE
              </span>
            </div>
            {/* Body — vintage terminal */}
            <div className="p-5 font-mono text-[0.73rem] space-y-3 bg-zinc-950 terminal-scanlines">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold">BUG REPORT #1024</span>
                <span className="text-[0.62rem] bg-red-500/20 text-red-400
                                 border-2 border-red-800/60 px-2 py-0.5 font-bold tracking-widest">
                  !! CRITICAL
                </span>
              </div>
              <p className="text-zinc-400 italic text-[0.78rem] border-l-2 border-amber-500/50 pl-3">
                &ldquo;The checkout button doesn&apos;t work&rdquo;
              </p>
              <div className="border-t border-zinc-800 pt-3 space-y-1.5">
                <div className="text-[0.58rem] text-zinc-600 uppercase tracking-[0.18em] font-bold mb-2">
                  // WHISPER AUTO-CAPTURED ↓
                </div>
                {[
                  { k: "User",          v: "sarah@acme.com (ID: usr_8f2a91)",    c: "text-emerald-400"  },
                  { k: "Browser",       v: "Chrome 126 · macOS 14.5",            c: "text-zinc-300"    },
                  { k: "Session",       v: "3 clicks, 1 form input, 1 scroll",   c: "text-zinc-300"    },
                  { k: "Network Error", v: "POST /api/checkout → 422 (1.24s)",   c: "text-red-400"     },
                  { k: "JS Error",      v: "TypeError: stripe is undefined",      c: "text-amber-400"  },
                  { k: "Console warn",  v: "Stripe.js loaded after DOMReady",     c: "text-orange-400" },
                ].map(({ k, v, c }) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-zinc-600 w-[110px] shrink-0">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-6 mx-10 bg-[radial-gradient(ellipse,rgba(251,191,36,0.12)_0%,transparent_70%)]" />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   COMPARISON
═══════════════════════════════════════════════════════ */
const OLD_WAY = [
  { icon: MessageSquare, text: "Email: \"Can you describe the issue?\"" },
  { icon: Clock,         text: "Wait 48 hours for a reply" },
  { icon: FileText,      text: "\"What browser were you using?\"" },
  { icon: Clock,         text: "Wait another 24 hours" },
  { icon: GitBranch,     text: "Guess, reproduce, fail, repeat" },
];

const NEW_WAY = [
  { icon: MousePointer2, text: "User submits 1-line feedback" },
  { icon: Zap,           text: "Whybug attaches full session replay" },
  { icon: Terminal,      text: "Console logs + network errors included" },
  { icon: User,          text: "User identity captured automatically" },
  { icon: Check,         text: "You fix it in minutes, not days" },
];

function Comparison() {
  return (
    <Section id="how-it-works" className="py-24 px-6 bg-[#FFFBF0] grid-paper-bg">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <SectionEyebrow>The Old Way vs. The Whybug Way</SectionEyebrow>
          <motion.h2 variants={fadeUp}
            className="font-black text-[clamp(1.9rem,4vw,3rem)] text-zinc-950 tracking-tight leading-tight">
            Get the full story behind every
            <br />
            <span className="text-zinc-500">&ldquo;It&apos;s broken&rdquo; email.</span>
          </motion.h2>
        </div>

        <motion.div variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Old Way */}
          <div className="border-2 border-zinc-950 bg-red-50 p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 border-2 border-zinc-950 bg-red-500
                              flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
                <X size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[0.88rem] font-black text-zinc-950">The Old Way</p>
                <p className="text-[0.7rem] font-mono text-zinc-500">Manual. Slow. Painful.</p>
              </div>
              <span className="ml-auto text-[0.62rem] font-mono font-black text-red-700 bg-red-100
                               border-2 border-red-700 px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                ~2 DAYS
              </span>
            </div>
            <div className="space-y-3">
              {OLD_WAY.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 border-2 border-zinc-300 bg-zinc-100
                                  flex items-center justify-center shrink-0">
                    <Icon size={11} className="text-zinc-500" />
                  </div>
                  <p className="text-[0.82rem] font-mono text-zinc-600 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Whisper Way */}
          <div className="border-2 border-zinc-950 bg-amber-50 p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 border-2 border-zinc-950 bg-amber-400
                              flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <Zap size={13} className="text-zinc-950" fill="currentColor" />
              </div>
              <div>
                <p className="text-[0.88rem] font-black text-zinc-950">The Whybug Way</p>
                <p className="text-[0.7rem] font-mono text-zinc-500">Automatic. Instant. Clear.</p>
              </div>
              <span className="ml-auto text-[0.62rem] font-mono font-black text-emerald-700 bg-emerald-100
                               border-2 border-emerald-700 px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                ~2 MINS
              </span>
            </div>
            <div className="space-y-3">
              {NEW_WAY.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 border-2 border-zinc-950 bg-amber-400
                                  flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_#000]">
                    <Icon size={11} className="text-zinc-950" />
                  </div>
                  <p className="text-[0.82rem] font-mono text-zinc-700 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pull quote */}
        <motion.div
          variants={fadeUp}
          role="blockquote"
          className="mt-6 border-2 border-zinc-950 bg-white
                     px-6 py-5 flex items-start gap-4 shadow-[6px_6px_0px_0px_#000]"
        >
          <div className="w-8 h-8 border-2 border-zinc-950 bg-emerald-400 flex items-center justify-center
                          text-[0.65rem] font-black text-zinc-950 shrink-0 shadow-[2px_2px_0px_0px_#000]">
            TM
          </div>
          <div>
            <p className="text-[0.85rem] font-mono text-zinc-600 italic leading-relaxed">
              &ldquo;I used to spend 3–4 hours a week just emailing users asking for more info.
              Whybug killed that entirely. I open the dashboard and everything is already there.&rdquo;
            </p>
            <p className="text-[0.72rem] font-mono text-zinc-500 mt-2">
              Theo Marchand · <span className="text-zinc-700 font-semibold">Founder @ Formly.io</span>
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURE BENTO GRID
═══════════════════════════════════════════════════════ */
function Features() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="features" className="py-28 px-6 bg-[#FFFBF0] grid-paper-bg">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
            className="inline-flex items-center gap-2 text-[0.68rem] font-mono font-black
                       text-amber-700 tracking-[0.18em] uppercase mb-5">
            <span className="w-5 h-[2px] bg-amber-600" />FEATURES<span className="w-5 h-[2px] bg-amber-600" />
          </motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
            className="font-black text-[clamp(1.9rem,4.5vw,3.2rem)] text-zinc-950 tracking-tight leading-tight">
            Debug in seconds,
            <br />
            <span className="text-zinc-500">not email threads.</span>
          </motion.h2>
          <motion.p variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
            className="mt-4 text-[0.92rem] font-mono text-zinc-600 max-w-lg mx-auto leading-relaxed">
            Stop playing detective. Get the full technical story behind every bug report,{" "}
            <span className="text-zinc-950 font-semibold">automatically.</span>
          </motion.p>
        </div>

        {/* ── Comparison bar ── */}
        <motion.div variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
          className="mb-12 border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_#000] overflow-hidden">
          <div className="grid grid-cols-2 divide-x-2 divide-zinc-950">
            <div className="px-6 py-4 bg-zinc-50">
              <div className="text-[0.6rem] font-mono font-black text-zinc-400 uppercase tracking-[0.18em] mb-2">
                // The Old Way
              </div>
              <div className="space-y-1.5">
                {[
                  "📧 20 back-and-forth emails",
                  "📸 \"Can you send a screenshot?\"",
                  "🤷 \"It works on my machine\"",
                  "🕐 Hours debugging a ghost bug",
                ].map((t, i) => (
                  <div key={i} className="text-[0.78rem] font-mono text-zinc-500 line-through decoration-red-400/60">{t}</div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 bg-amber-50">
              <div className="text-[0.6rem] font-mono font-black text-amber-700 uppercase tracking-[0.18em] mb-2">
                // The Whybug Way
              </div>
              <div className="space-y-1.5">
                {[
                  "⚡ 1 report with everything inside",
                  "🖥️ Full browser console, captured",
                  "📍 Exact browser, OS, screen size",
                  "✅ Fixed before standup",
                ].map((t, i) => (
                  <div key={i} className="text-[0.78rem] font-mono text-zinc-950 font-medium">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 3 Scenario Cards ── */}
        <motion.div
          variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 — Timeline of Truth */}
          <motion.div variants={fadeUp}
            className="border-2 border-zinc-950 bg-white p-6
                       shadow-[6px_6px_0px_0px_#000]
                       hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]
                       transition-[transform,box-shadow] duration-75 flex flex-col">
            <div className="w-9 h-9 border-2 border-zinc-950 bg-amber-400
                            flex items-center justify-center text-zinc-950 mb-5 shadow-[3px_3px_0px_0px_#000]">
              <MousePointer2 size={17} />
            </div>
            <div className="text-[0.62rem] font-mono font-black text-amber-700 uppercase tracking-[0.14em] mb-1">
              What happened before they hit send?
            </div>
            <h3 className="font-black text-[1.05rem] text-zinc-950 tracking-tight mb-2.5">
              Timeline of Truth
            </h3>
            <p className="text-[0.81rem] font-mono text-zinc-600 leading-relaxed mb-5 flex-1">
              No more guessing. See exactly where they clicked, what they scrolled, and how they
              got lost — <span className="text-zinc-950 font-semibold">30 seconds before the report.</span>
            </p>
            {/* Mini session timeline */}
            <div className="border-2 border-zinc-950 bg-zinc-950 p-3 font-mono text-[0.64rem]
                            space-y-2 terminal-scanlines shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
              <div className="text-zinc-600 text-[0.57rem] uppercase tracking-[0.15em] font-bold pb-1.5 border-b border-zinc-800">
                // SESSION · LAST 30S
              </div>
              {[
                { label: 'Clicked "Add to cart"', t: "28s", c: "text-amber-400" },
                { label: 'Clicked "Checkout"',    t: "24s", c: "text-amber-400" },
                { label: "Navigated → /checkout", t: "23s", c: "text-emerald-400" },
                { label: 'Clicked "Pay Now"',     t: "4s",  c: "text-amber-400" },
                { label: "JS Error thrown",       t: "3s",  c: "text-red-400" },
              ].map(({ label, t, c }, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${c.replace("text-", "bg-")}`} />
                  <span className="text-zinc-400 flex-1 truncate">{label}</span>
                  <span className="text-zinc-600 shrink-0 tabular-nums">{t} ago</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 2 — Inside the Browser */}
          <motion.div variants={fadeUp}
            className="border-2 border-zinc-950 bg-white p-6
                       shadow-[6px_6px_0px_0px_#000]
                       hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]
                       transition-[transform,box-shadow] duration-75 flex flex-col">
            <div className="w-9 h-9 border-2 border-zinc-950 bg-violet-400
                            flex items-center justify-center text-zinc-950 mb-5 shadow-[3px_3px_0px_0px_#000]">
              <Terminal size={17} />
            </div>
            <div className="text-[0.62rem] font-mono font-black text-violet-700 uppercase tracking-[0.14em] mb-1">
              Their console is now your console.
            </div>
            <h3 className="font-black text-[1.05rem] text-zinc-950 tracking-tight mb-2.5">
              Inside the Browser
            </h3>
            <p className="text-[0.81rem] font-mono text-zinc-600 leading-relaxed mb-5 flex-1">
              Instantly see JavaScript errors and failed network requests.{" "}
              <span className="text-zinc-950 font-semibold">No more asking for screenshots of the Inspect panel.</span>
            </p>
            {/* Mini terminal */}
            <div className="border-2 border-zinc-950 bg-zinc-950 overflow-hidden font-mono text-[0.65rem]
                            terminal-scanlines shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
              {[
                { badge: "error", text: "TypeError: stripe is undefined",         bc: "bg-red-500/20 text-red-400 border border-red-800/60" },
                { badge: "warn",  text: "Stripe.js loaded after DOMContentLoaded", bc: "bg-amber-500/20 text-amber-400 border border-amber-800/50" },
                { badge: "500",   text: "POST /api/checkout  ·  1 240ms",          bc: "bg-orange-500/20 text-orange-400 border border-orange-800/50" },
              ].map(({ badge, text, bc }, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 ${i ? "border-t border-zinc-800" : ""}`}>
                  <span className={`shrink-0 px-1.5 py-[2px] text-[0.55rem] font-bold uppercase tracking-wider ${bc}`}>
                    {badge}
                  </span>
                  <span className="text-zinc-400 break-all leading-relaxed">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3 — Ghost-Bug Hunter */}
          <motion.div variants={fadeUp}
            className="border-2 border-zinc-950 bg-white p-6
                       shadow-[6px_6px_0px_0px_#000]
                       hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]
                       transition-[transform,box-shadow] duration-75 flex flex-col">
            <div className="w-9 h-9 border-2 border-zinc-950 bg-emerald-400
                            flex items-center justify-center text-zinc-950 mb-5 shadow-[3px_3px_0px_0px_#000]">
              <Gauge size={17} />
            </div>
            <div className="text-[0.62rem] font-mono font-black text-emerald-700 uppercase tracking-[0.14em] mb-1">
              It works on my machine, but not theirs?
            </div>
            <h3 className="font-black text-[1.05rem] text-zinc-950 tracking-tight mb-2.5">
              Ghost-Bug Hunter
            </h3>
            <p className="text-[0.81rem] font-mono text-zinc-600 leading-relaxed mb-5 flex-1">
              Automatically capture Browser, OS, Screen Size, and User ID. Fix{" "}
              <span className="text-zinc-950 font-semibold">Safari-only and mobile-only bugs</span>{" "}
              without a single follow-up question.
            </p>
            {/* Environment snapshot */}
            <div className="border-2 border-zinc-950 bg-zinc-950 p-3 font-mono text-[0.65rem]
                            space-y-2 terminal-scanlines shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
              <div className="text-zinc-600 text-[0.57rem] uppercase tracking-[0.15em] font-bold pb-1.5 border-b border-zinc-800">
                // ENVIRONMENT SNAPSHOT
              </div>
              {[
                { key: "browser",  val: "Safari 17.4",       c: "text-amber-400" },
                { key: "os",       val: "iOS 17.4.1",         c: "text-emerald-400" },
                { key: "screen",   val: "390 × 844 · @3x",   c: "text-zinc-400" },
                { key: "language", val: "\"en-US\"",          c: "text-violet-400" },
                { key: "onLine",   val: "true",               c: "text-emerald-400" },
              ].map(({ key, val, c }, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-emerald-400 shrink-0">{key}</span>
                  <span className="text-zinc-600">→</span>
                  <span className={c}>{val}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── CTA nudge ── */}
        <motion.p variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
          className="text-center mt-12 text-[0.78rem] font-mono text-zinc-500">
          Never ask{" "}
          <span className="line-through decoration-red-400/70 text-zinc-400">&quot;Can you send me a screenshot?&quot;</span>
          {" "}ever again.
        </motion.p>

      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   INTEGRATIONS
═══════════════════════════════════════════════════════ */
const SlackLogo  = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);
const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);
const LinearLogo = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5" fill="currentColor">
    <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857l36.5093 36.5093c.6889.6889.0915 1.8189-.857 1.5964C20.0515 94.4, 5.5765 79.925 1.22541 61.5228zM.00189 46.8891c-.01189-.5803.22489-1.1208.64258-1.5385L46.3506.64058C46.7683.22289 47.3088-.01391 47.8891.00189 60.9243.48 73.1079 6.4727 81.8274 16.1646L16.1646 81.8274C6.47274 73.1079.480004 60.9243.00189 46.8891zM99.9981 53.1109c.0119.5803-.2249 1.1208-.6426 1.5385L53.6494 99.3594c-.4177.4177-.9582.6545-1.5385.6387-13.0352-.4781-25.2188-6.4708-33.9383-16.1627L83.8354 18.1729c9.6919 8.7195 15.6846 20.9031 16.1627 33.9380z"/>
  </svg>
);
const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const INTEGRATIONS_READY = [
  { name: "Slack",   Logo: SlackLogo,  desc: "Instant channel alerts", color: "#4A154B", text: "#E01E5A" },
  { name: "Email",   Logo: EmailIcon,  desc: "Developer receipts",     color: "#FBBF24", text: "#1c1917" },
];

const INTEGRATIONS_SOON = [
  { name: "GitHub",  Logo: GitHubLogo, desc: "Auto-open issues",    color: "#161B22", text: "#ffffff" },
  { name: "Discord", Logo: DiscordLogo,desc: "Team notifications",  color: "#5865F2", text: "#ffffff" },
  { name: "Linear",  Logo: LinearLogo, desc: "Create tickets fast", color: "#5E6AD2", text: "#ffffff" },
];

function Integrations() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-6 bg-amber-50 grid-paper-bg border-y-2 border-zinc-950">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <SectionEyebrow>Integrations</SectionEyebrow>
          <motion.h2 variants={fadeUp}
            className="font-black text-[clamp(1.7rem,3.5vw,2.6rem)] text-zinc-950 tracking-tight mb-3">
            Fits right into your workflow.
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-[0.88rem] font-mono text-zinc-600 max-w-md mx-auto mb-12">
            Send bug alerts wherever your team already lives. One toggle in the dashboard.
          </motion.p>

          {/* Ready */}
          <motion.div variants={fadeUp} className="mb-3">
            <div className="inline-flex items-center gap-2 text-[0.6rem] font-mono font-black text-emerald-700 uppercase tracking-[0.15em] mb-4">
              <span className="w-1.5 h-1.5 bg-emerald-500 inline-block" />
              Available now
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {INTEGRATIONS_READY.map(({ name, Logo, desc, color, text }) => (
                <motion.div
                  key={name}
                  whileTap={{ x: 2, y: 2 }}
                  className="flex items-center gap-3 px-5 py-3.5
                             border-2 border-zinc-950 bg-white
                             shadow-[5px_5px_0px_0px_#000]
                             hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px]
                             transition-[transform,box-shadow] duration-75 cursor-default"
                >
                  <div className="w-9 h-9 border-2 border-zinc-950 flex items-center justify-center shrink-0
                                  shadow-[2px_2px_0px_0px_#000]"
                    style={{ background: color, color: text }}>
                    <Logo />
                  </div>
                  <div className="text-left">
                    <div className="text-[0.82rem] font-black text-zinc-950">{name}</div>
                    <div className="text-[0.68rem] font-mono text-zinc-500">{desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp} className="flex items-center gap-4 justify-center my-6">
            <div className="h-px bg-zinc-300 w-16" />
            <span className="text-[0.62rem] font-mono text-zinc-400 uppercase tracking-[0.15em]">coming soon</span>
            <div className="h-px bg-zinc-300 w-16" />
          </motion.div>

          {/* Coming soon */}
          <motion.div variants={fadeUp}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {INTEGRATIONS_SOON.map(({ name, Logo, desc, color, text }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 px-5 py-3.5
                             border-2 border-zinc-300 bg-white/60
                             opacity-50 cursor-default select-none relative"
                >
                  <div className="w-9 h-9 border-2 border-zinc-300 flex items-center justify-center shrink-0"
                    style={{ background: color, color: text }}>
                    <Logo />
                  </div>
                  <div className="text-left">
                    <div className="text-[0.82rem] font-black text-zinc-700">{name}</div>
                    <div className="text-[0.68rem] font-mono text-zinc-400">{desc}</div>
                  </div>
                  <span className="absolute -top-2.5 -right-2.5 text-[0.52rem] font-mono font-black
                                   bg-zinc-950 text-white px-1.5 py-[2px] uppercase tracking-wider">
                    SOON
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    quote: "I used to spend 3–4 hours a week just emailing users asking for more info. Whybug killed that entirely. Now I open the dashboard and everything is already there. It's like having a co-founder watching prod 24/7.",
    name: "Theo Marchand", handle: "@theomarchand", role: "Founder @ Formly.io",
    initials: "TM", color: "#d97706",
  },
  {
    quote: "Honestly thought I'd just use Sentry. Then I saw Whybug — it's 10× simpler and the session replay is incredible. Found a race condition in my Stripe integration in under 5 minutes. That used to take me a full day.",
    name: "Priya Rao", handle: "@priyabuilds", role: "Indie Hacker · Builder",
    initials: "PR", color: "#059669",
  },
];

function Testimonials() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-6 bg-[#FFFBF0]">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <div className="text-center mb-12">
            <SectionEyebrow>Testimonials</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-black text-[clamp(1.7rem,3.5vw,2.6rem)] text-zinc-950 tracking-tight">
              Loved by indie hackers.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map(t => (
              <motion.div key={t.handle} variants={fadeUp}
                className="border-2 border-zinc-950 bg-white p-6
                           shadow-[6px_6px_0px_0px_#000]
                           hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]
                           transition-[transform,box-shadow] duration-75 flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-[0.85rem] font-mono text-zinc-600 leading-relaxed flex-1 mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t-2 border-zinc-950">
                  <div className="w-9 h-9 border-2 border-zinc-950 flex items-center justify-center
                                  text-[0.72rem] font-black text-white shrink-0 shadow-[2px_2px_0px_0px_#000]"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[0.83rem] font-black text-zinc-950">{t.name}</div>
                    <div className="text-[0.7rem] font-mono text-zinc-500">{t.handle} · {t.role}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[0.62rem] font-mono font-bold
                                  text-emerald-700 bg-emerald-100 border-2 border-emerald-700
                                  px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                    <Shield size={10} /> Verified
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING
═══════════════════════════════════════════════════════ */
function Pricing() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      id: "hacker",
      name: "The Hacker",
      tier: "Free",
      price: { monthly: "$0", yearly: "$0" },
      period: "forever",
      desc: "For side projects and exploring Whybug.",
      cta: "Get Started",
      ctaStyle: "ghost" as const,
      features: [
        "1 Project",
        "20 Reports / month",
        "7-day history",
        "Session timeline (last 30s)",
        "Console + JS error capture",
        '"Powered by Whybug" branding',
      ],
    },
    {
      id: "founder",
      name: "The Founder",
      tier: "Pro",
      price: { monthly: "$12", yearly: "$9" },
      period: yearly ? "/ mo, billed yearly" : "/ month",
      desc: "For founders who ship fast and need to fix faster.",
      cta: "Upgrade to Pro",
      ctaStyle: "primary" as const,
      badge: "Most Popular",
      features: [
        "Unlimited Projects",
        "Unlimited Reports",
        "90-day history",
        "No Whybug branding",
        "Slack & Email alerts",
        "User Identification (HMAC)",
        "Priority support",
      ],
    },
    {
      id: "ltd",
      name: "Early Adopter",
      tier: "Lifetime",
      price: { monthly: "$49", yearly: "$49" },
      period: "one-time",
      desc: "All Pro features. Pay once, own it forever.",
      cta: "Grab Lifetime Access",
      ctaStyle: "ltd" as const,
      badge: "Limited · 50 spots",
      features: [
        "Everything in Pro",
        "Forever access",
        "Early access to new features",
        '"OG Founder" badge in dashboard',
        "Founding supporter status",
        "1-on-1 onboarding call",
      ],
    },
  ];

  return (
    <section ref={ref} id="pricing" className="py-28 px-6 bg-[#FFFBF0] grid-paper-bg">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>

          {/* Header */}
          <div className="text-center mb-12">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-black text-[clamp(1.9rem,4vw,3rem)] text-zinc-950 tracking-tight">
              Simple, honest pricing.
            </motion.h2>
            <motion.p variants={fadeUp} className="font-mono text-zinc-600 text-[0.88rem] mt-2">
              No seats. No per-event billing. Cancel any time.
            </motion.p>

            {/* Retro toggle */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mt-7 border-2 border-zinc-950 bg-white shadow-[4px_4px_0px_0px_#000] px-4 py-2.5">
              <span className={`text-[0.75rem] font-mono font-bold transition-colors ${!yearly ? "text-zinc-950" : "text-zinc-400"}`}>
                Monthly
              </span>
              <button
                onClick={() => setYearly(v => !v)}
                className={`relative w-11 h-6 border-2 border-zinc-950 transition-colors duration-150 ${yearly ? "bg-amber-400" : "bg-zinc-200"}`}
                aria-label="Toggle billing period"
              >
                <span className={`absolute top-[2px] w-4 h-4 bg-zinc-950 transition-all duration-150 ${yearly ? "left-[22px]" : "left-[2px]"}`} />
              </button>
              <span className={`text-[0.75rem] font-mono font-bold transition-colors ${yearly ? "text-zinc-950" : "text-zinc-400"}`}>
                Yearly
              </span>
              {yearly && (
                <span className="text-[0.58rem] font-mono font-black text-emerald-700 bg-emerald-100 border border-emerald-600 px-1.5 py-[2px] uppercase tracking-wider">
                  2 months free
                </span>
              )}
            </motion.div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const isFounder = plan.id === "founder";
              const isLtd     = plan.id === "ltd";

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  whileTap={{ x: 2, y: 2 }}
                  className={`relative p-7 flex flex-col transition-[transform,box-shadow] duration-75
                    border-2
                    ${isFounder
                      ? "border-amber-500 bg-white shadow-[8px_8px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                      : isLtd
                      ? "border-zinc-950 bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(251,191,36,0.6)] hover:shadow-[10px_10px_0px_0px_rgba(251,191,36,0.6)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                      : "border-zinc-950 bg-white shadow-[6px_6px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                    }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1
                                    text-[0.6rem] font-mono font-black tracking-[0.12em] uppercase whitespace-nowrap
                                    border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]
                                    ${isLtd
                                      ? "bg-amber-400 text-zinc-950 border-zinc-950"
                                      : "bg-zinc-950 text-amber-400 border-zinc-950"
                                    }`}>
                      ★ {plan.badge}
                    </div>
                  )}

                  {/* Tier label */}
                  <div className={`text-[0.6rem] font-mono font-black uppercase tracking-[0.18em] mb-3 ${isLtd ? "text-amber-400/70" : "text-zinc-400"}`}>
                    // {plan.tier}
                  </div>

                  {/* Name */}
                  <h3 className={`font-black text-[1.0rem] tracking-tight mb-4 ${isLtd ? "text-white" : "text-zinc-950"}`}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`font-black text-[3rem] leading-none tabular-nums ${isLtd ? "text-amber-400" : "text-zinc-950"}`}>
                      {yearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                  </div>
                  <div className={`text-[0.72rem] font-mono mb-3 ${isLtd ? "text-zinc-500" : "text-zinc-500"}`}>
                    {plan.period}
                    {plan.id === "founder" && !yearly && (
                      <span className="ml-2 text-emerald-600 font-bold">or $9/mo yearly</span>
                    )}
                  </div>
                  <p className={`text-[0.79rem] font-mono mb-6 leading-relaxed ${isLtd ? "text-zinc-400" : "text-zinc-600"}`}>
                    {plan.desc}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={13} className={`mt-0.5 shrink-0 ${isLtd ? "text-amber-400" : isFounder ? "text-amber-600" : "text-emerald-600"}`} />
                        <span className={`text-[0.79rem] font-mono ${isLtd ? "text-zinc-300" : "text-zinc-600"}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.a
                    href="#"
                    whileTap={{ x: 2, y: 2 }}
                    className={`block text-center py-3.5 text-[0.85rem] font-black
                                transition-[transform,box-shadow] duration-75 border-2
                                ${plan.ctaStyle === "primary"
                                  ? "bg-amber-400 text-zinc-950 border-zinc-950 shadow-[5px_5px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
                                  : plan.ctaStyle === "ltd"
                                  ? "bg-amber-400 text-zinc-950 border-zinc-950 shadow-[5px_5px_0px_0px_rgba(251,191,36,0.5)] hover:shadow-[3px_3px_0px_0px_rgba(251,191,36,0.5)] hover:translate-x-[2px] hover:translate-y-[2px]"
                                  : "bg-white text-zinc-950 border-zinc-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                                }`}
                  >
                    {plan.cta}
                  </motion.a>
                </motion.div>
              );
            })}
          </div>

          {/* Footer hint */}
          <motion.p variants={fadeUp} className="text-center mt-10 text-[0.74rem] font-mono text-zinc-500">
            Self-hosting?{" "}
            <a href="mailto:hello@whybug.info" className="text-zinc-700 underline underline-offset-2 hover:text-zinc-950 transition-colors">
              Contact us
            </a>{" "}
            for Open Source options.
          </motion.p>

        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════ */
const FAQS = [
  {
    q: "Will it slow down my site?",
    a: "No. The Whybug script is under 5 KB gzipped and loads with the defer attribute — it never blocks rendering, never affects your Largest Contentful Paint, and has zero impact on Core Web Vitals. We built it obsessively lightweight.",
  },
  {
    q: "What about user privacy? Are you recording keystrokes?",
    a: "Absolutely not. Whybug tracks interaction types and element identifiers (e.g. \"Typed in #email-input\"), never the actual values. Passwords, payment fields, and any input values are never captured. You can additionally mark any element with data-whybug-ignore and we will skip it entirely.",
  },
  {
    q: "Does it work with React / Next.js?",
    a: "Yes — and everything else. Whybug is a plain JavaScript snippet with no framework dependency. It works with React, Next.js, Vue, Svelte, Laravel Blade, Rails ERB, plain HTML, whatever you ship.",
  },
  {
    q: "What's the difference between Whybug and Sentry?",
    a: "Sentry is a full error monitoring platform with a steep learning curve and pricing that scales uncomfortably. Whybug focuses on one thing: giving you enough context to fix a bug the first time a user reports it — session replay, network calls, and logs in one place, instantly, without a complex setup.",
  },
  {
    q: "How does the 30-second session replay work?",
    a: "Whybug keeps a rolling 30-second buffer of DOM events (clicks, navigation, debounced inputs) in memory. When a user submits feedback, it flushes this buffer into the report payload. No video recording, no server streaming — just a structured timeline of what the user did right before the issue.",
  },
  {
    q: "Can I self-host Whybug?",
    a: "A self-hosted / on-premise option is on the roadmap. Sign up for free to get notified when it launches. Enterprise plans with custom data residency are available — reach out.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="faq" className="py-24 px-6 bg-[#FFFBF0]">
      <div className="max-w-2xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <div className="text-center mb-12">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-black text-[clamp(1.9rem,4vw,3rem)] text-zinc-950 tracking-tight">
              Honest answers.
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className={`border-2 transition-[border-color,box-shadow,background-color] duration-100 overflow-hidden ${
                  open === i
                    ? "border-zinc-950 bg-amber-50 shadow-[5px_5px_0px_0px_#000]"
                    : "border-zinc-950 bg-white shadow-[5px_5px_0px_0px_#000] hover:bg-zinc-50"
                }`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4
                             px-5 py-4 text-left"
                >
                  <span className={`text-[0.88rem] font-black transition-colors duration-100 ${
                    open === i ? "text-amber-700" : "text-zinc-950"
                  }`}>
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`shrink-0 transition-colors duration-100 ${
                      open === i ? "text-amber-700" : "text-zinc-600"
                    }`}>
                    <ChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[0.83rem] font-mono text-zinc-600 leading-relaxed border-t-2 border-zinc-200 pt-3">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════════════════ */
function FinalCTA() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-28 px-6 relative overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 grid-paper-bg" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.p variants={fadeUp}
            className="text-[0.65rem] font-mono font-black text-zinc-600 mb-5 tracking-[0.2em] uppercase">
            // FREE TO START · NO CREDIT CARD REQUIRED
          </motion.p>
          <motion.h2 variants={fadeUp}
            className="font-black text-[clamp(2.2rem,5vw,3.8rem)] text-zinc-50 tracking-tight leading-[1.05] mb-5">
            Ready to save hours
            <br />
            <span className="text-amber-400">
              on debugging?
            </span>
          </motion.h2>
          <motion.p variants={fadeUp}
            className="font-mono text-zinc-400 text-[0.92rem] leading-relaxed mb-10 max-w-md mx-auto">
            Join hundreds of indie hackers who ship with confidence. Add one script tag
            and you&apos;ll never ask &ldquo;what browser were you using?&rdquo; again.
          </motion.p>
          <motion.div variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a href="#pricing"
              whileTap={{ x: 2, y: 2 }}
              className="group flex items-center gap-2.5 px-8 py-4
                         bg-amber-400 text-zinc-950 font-black text-[0.92rem]
                         border-2 border-amber-300
                         shadow-[6px_6px_0px_0px_rgba(251,191,36,0.4)]
                         hover:shadow-[4px_4px_0px_0px_rgba(251,191,36,0.4)] hover:translate-x-[2px] hover:translate-y-[2px]
                         transition-[transform,box-shadow] duration-75">
              Get Started for Free
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.a>
            <a href="#demo"
              className="text-[0.84rem] font-mono font-bold text-zinc-500 hover:text-amber-400 transition-colors
                         underline underline-offset-4 decoration-zinc-700">
              See live demo →
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t-2 border-zinc-950 bg-[#FFFBF0] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 flex items-center justify-center border-2 border-zinc-950 bg-amber-400
                           shadow-[2px_2px_0px_0px_#000]">
            <Zap size={11} className="text-zinc-950" fill="currentColor" />
          </span>
          <span className="font-black text-[0.95rem] text-zinc-950 tracking-tight">Whybug</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {["Features", "Pricing", "Docs", "Blog", "Changelog", "Status", "Privacy"].map(l => (
            <a key={l} href="#"
              className="text-[0.73rem] font-mono font-semibold text-zinc-500 hover:text-amber-700
                         border-b-2 border-transparent hover:border-amber-400 transition-all">
              {l}
            </a>
          ))}
        </nav>
        <div className="text-right">
          <p className="text-[0.72rem] font-mono text-zinc-500">
            Built by an indie hacker.{" "}
            <span className="text-zinc-500">For indie hackers.</span>
          </p>
          <p className="text-[0.66rem] font-mono text-zinc-400 mt-0.5">
            © {new Date().getFullYear()} Whybug. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#FFFBF0] text-zinc-950">
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Divider />
        <Comparison />
        <Divider />
        <Features />
        <Divider />
        <DemoSection />
        <Divider />
        <Integrations />
        <Divider />
        <Testimonials />
        <Divider />
        <Pricing />
        <Divider />
        <FAQ />
        <Divider />
        <FinalCTA />
        <Footer />
        <WhisperWidgetDemo />
      </div>
    </main>
  );
}
