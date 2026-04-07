"use client";

import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Zap, ArrowRight, Check, X, ChevronDown,
  Clock, FileText, MessageSquare, GitBranch,
  Terminal, Network, Package, User,
  MousePointer2, Shield, Gauge, Star,
} from "lucide-react";
import DemoSection from "./components/DemoSection";
import WhisperWidgetDemo from "./components/WhisperWidgetDemo";

/* ═══════════════════════════════════════════════════════
   MOTION VARIANTS
═══════════════════════════════════════════════════════ */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
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
      className="inline-flex items-center gap-2 text-[0.7rem] font-mono font-semibold
                 text-cyan-600 tracking-[0.14em] uppercase mb-4">
      <span className="w-4 h-px bg-cyan-500/50" />
      {children}
      <span className="w-4 h-px bg-cyan-500/50" />
    </motion.div>
  );
}

function Divider() {
  return (
    <div className="w-full h-px bg-gradient-to-r
                    from-transparent via-slate-200 to-transparent" />
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm shadow-slate-900/5"
          : "border-b border-transparent bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="text-cyan-600 group-hover:scale-110 transition-transform duration-200">
            <Zap size={14} fill="currentColor" />
          </span>
          <span className="font-bold text-[1.05rem] text-slate-900 tracking-tight">
            Whisper
          </span>
        </a>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className="text-[0.8rem] font-medium text-slate-600
                         hover:text-slate-900 transition-colors duration-150">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="/sign-in" className="hidden md:block text-[0.8rem] text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </a>
          <motion.a href="#pricing"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="text-[0.8rem] font-semibold px-3.5 py-[7px] rounded-lg
                       bg-cyan-600 text-white
                       shadow-md shadow-cyan-600/20
                       hover:bg-cyan-500 transition-colors duration-200">
            Get Started Free
          </motion.a>
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
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-8
                     border border-cyan-500/25 bg-cyan-500/[0.07]
                     text-cyan-700 text-[0.72rem] font-mono font-semibold tracking-wide"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-600" />
          </span>
          PUBLIC BETA · FREE TO START · NO CREDIT CARD
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="font-bold text-[clamp(2.8rem,7vw,5.6rem)] leading-[1.0]
                     tracking-tight text-slate-900 mb-6"
        >
          Stop playing detective
          <br />
          <span className="bg-gradient-to-r from-cyan-600 to-emerald-500
                           bg-clip-text text-transparent">
            with your bug reports.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3 }}
          className="text-[1.05rem] text-slate-600 leading-relaxed max-w-xl mx-auto mb-10"
        >
          Whisper captures the last 30 seconds of user actions, console logs, and network
          errors{" "}
          <span className="text-slate-900 font-medium">automatically</span>.
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
            whileHover={{ scale: 1.04, boxShadow: "0 12px 40px rgba(8,145,178,0.28)" }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                       bg-cyan-600 text-white font-bold text-[0.92rem] tracking-tight
                       shadow-md shadow-cyan-600/25 transition-all duration-200 hover:bg-cyan-500">
            Get Started for Free
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </motion.a>
          <a href="#demo"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl
                       border border-slate-200 bg-white text-slate-700 text-[0.88rem] font-medium
                       shadow-sm hover:border-slate-300 hover:text-slate-900 transition-all duration-200">
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
            {["#0891b2", "#10b981", "#f59e0b", "#a78bfa", "#f472b6"].map((c, i) => (
              <div key={i}
                className="w-6 h-6 rounded-full border-2 border-slate-50 flex items-center justify-center
                           text-[0.5rem] font-bold text-slate-900 shadow-sm"
                style={{ background: c, zIndex: 5 - i }}>
                {["RG", "TM", "PK", "SL", "AJ"][i]}
              </div>
            ))}
          </div>
          <p className="text-[0.78rem] text-slate-600">
            Used by <span className="text-slate-800 font-medium">indie hackers</span> to fix bugs{" "}
            <span className="text-slate-800 font-medium">10× faster</span>
          </p>
        </motion.div>

        {/* Hero terminal — dark panel on light page (report preview) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden
                          shadow-xl shadow-slate-900/10">
            {/* Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="ml-3 text-[0.68rem] font-mono text-slate-500">
                whisper · report #1024 · 2 seconds to diagnose
              </span>
            </div>
            {/* Body */}
            <div className="p-5 font-mono text-[0.73rem] space-y-3 bg-slate-900 text-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-cyan-400 font-semibold">Bug Report #1024</span>
                <span className="text-[0.62rem] bg-red-500/15 text-red-400
                                 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
                  CRITICAL
                </span>
              </div>
              <p className="text-slate-300 italic text-[0.78rem]">
                &ldquo;The checkout button doesn&apos;t work&rdquo;
              </p>
              <div className="border-t border-white/10 pt-3 space-y-1.5">
                <div className="text-[0.62rem] text-slate-500 uppercase tracking-widest font-semibold mb-2">
                  Whisper auto-captured ↓
                </div>
                {[
                  { k: "User",          v: "sarah@acme.com (ID: usr_8f2a91)",    c: "text-emerald-400"  },
                  { k: "Browser",       v: "Chrome 126 · macOS 14.5",            c: "text-slate-300"   },
                  { k: "Session",       v: "3 clicks, 1 form input, 1 scroll",   c: "text-slate-300"   },
                  { k: "Network Error", v: "POST /api/checkout → 422 (1.24s)",   c: "text-red-400"    },
                  { k: "JS Error",      v: "TypeError: stripe is undefined",      c: "text-yellow-400" },
                  { k: "Console warn",  v: "Stripe.js loaded after DOMReady",     c: "text-amber-400"  },
                ].map(({ k, v, c }) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-slate-500 w-[110px] shrink-0">{k}</span>
                    <span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="h-8 mx-10 bg-[radial-gradient(ellipse,rgba(8,145,178,0.12)_0%,transparent_70%)]" />
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
  { icon: Zap,           text: "Whisper attaches full session replay" },
  { icon: Terminal,      text: "Console logs + network errors included" },
  { icon: User,          text: "User identity captured automatically" },
  { icon: Check,         text: "You fix it in minutes, not days" },
];

function Comparison() {
  return (
    <Section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <SectionEyebrow>The Old Way vs. The Whisper Way</SectionEyebrow>
          <motion.h2 variants={fadeUp}
            className="font-bold text-[clamp(1.9rem,4vw,3rem)] text-slate-900 tracking-tight leading-tight">
            Get the full story behind every
            <br />
            <span className="text-slate-600">&ldquo;It&apos;s broken&rdquo; email.</span>
          </motion.h2>
        </div>

        <motion.div variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Old Way */}
          <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/20
                              flex items-center justify-center">
                <X size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-[0.88rem] font-bold text-slate-900">The Old Way</p>
                <p className="text-[0.7rem] text-slate-500">Manual. Slow. Painful.</p>
              </div>
              <span className="ml-auto text-[0.68rem] font-mono text-red-400 bg-red-500/10
                               border border-red-500/20 px-2 py-0.5 rounded-full">
                ~2 days
              </span>
            </div>
            <div className="space-y-3">
              {OLD_WAY.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-lg bg-slate-100 border border-slate-200
                                  flex items-center justify-center shrink-0">
                    <Icon size={11} className="text-slate-600" />
                  </div>
                  <p className="text-[0.82rem] text-slate-600 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Whisper Way */}
          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] p-6
                          shadow-[0_0_40px_rgba(8,145,178,0.08)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/10 border border-cyan-500/25
                              flex items-center justify-center">
                <Zap size={13} className="text-cyan-600" fill="currentColor" />
              </div>
              <div>
                <p className="text-[0.88rem] font-bold text-slate-900">The Whisper Way</p>
                <p className="text-[0.7rem] text-slate-500">Automatic. Instant. Clear.</p>
              </div>
              <span className="ml-auto text-[0.68rem] font-mono text-emerald-600 bg-emerald-500/10
                               border border-emerald-500/25 px-2 py-0.5 rounded-full">
                ~2 mins
              </span>
            </div>
            <div className="space-y-3">
              {NEW_WAY.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-xl bg-cyan-600/10 border border-cyan-500/25
                                  flex items-center justify-center shrink-0 shadow-sm">
                    <Icon size={11} className="text-cyan-600" />
                  </div>
                  <p className="text-[0.82rem] text-slate-700 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pull quote */}
        <motion.div
          variants={fadeUp}
          role="blockquote"
          className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80
                     px-6 py-5 flex items-start gap-4"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center
                          text-[0.65rem] font-bold text-slate-900 shrink-0">
            TM
          </div>
          <div>
            <p className="text-[0.85rem] text-slate-600 italic leading-relaxed">
              &ldquo;I used to spend 3–4 hours a week just emailing users asking for more info.
              Whisper killed that entirely. I open the dashboard and everything is already there.&rdquo;
            </p>
            <p className="text-[0.72rem] text-slate-500 mt-2">
              Theo Marchand · <span className="text-slate-600">Founder @ Formly.io</span>
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
    <section ref={ref} id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
            className="inline-flex items-center gap-2 text-[0.7rem] font-mono font-semibold
                       text-cyan-600 tracking-[0.14em] uppercase mb-4">
            <span className="w-4 h-px bg-cyan-500/50" />Features<span className="w-4 h-px bg-cyan-500/50" />
          </motion.div>
          <motion.h2 variants={fadeUp} initial="hidden" animate={inView ? "visible" : "hidden"}
            className="font-bold text-[clamp(1.9rem,4vw,3rem)] text-slate-900 tracking-tight">
            Everything developers actually need.
            <br />
            <span className="text-slate-600">Nothing they don&apos;t.</span>
          </motion.h2>
        </div>

        <motion.div
          variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Card 1 — Time-Travel Debugging (wide) */}
          <motion.div variants={fadeUp}
            className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] p-6 hover:border-slate-300
                       transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(8,145,178,0.06)_0%,transparent_70%)]" />
            <div className="relative flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/10 border border-cyan-500/25
                                flex items-center justify-center text-cyan-600 mb-4">
                  <MousePointer2 size={17} />
                </div>
                <div className="text-[0.65rem] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
                  Card 1
                </div>
                <h3 className="font-bold text-[1.1rem] text-slate-900 tracking-tight mb-2">
                  Time-Travel Debugging
                </h3>
                <p className="text-[0.83rem] text-slate-600 leading-relaxed max-w-sm">
                  Whisper silently records every click, keystroke (not the values — privacy-safe),
                  and navigation event for the last 30 seconds before a report is submitted.
                  You get a full session replay, not a vague description.
                </p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {["Clicks", "Scrolls", "Navigation", "Form inputs", "30s window"].map(t => (
                    <span key={t} className="text-[0.68rem] font-mono text-slate-600
                                             bg-slate-100 border border-slate-200
                                             px-2.5 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {/* Mini session timeline visual */}
              <div className="md:w-52 shrink-0 rounded-xl border border-slate-200
                              bg-slate-900 p-3 font-mono text-[0.65rem] space-y-2.5 self-start text-slate-300">
                <div className="text-slate-500 uppercase tracking-widest text-[0.58rem] mb-1">
                  session · last 30s
                </div>
                {[
                  { icon: MousePointer2, label: 'Clicked "Add to cart"',  t: "28s ago", c: "text-cyan-600" },
                  { icon: MousePointer2, label: 'Clicked "Checkout"',     t: "24s ago", c: "text-cyan-600" },
                  { icon: Package,       label: "Navigated /checkout",    t: "23s ago", c: "text-emerald-400" },
                  { icon: MousePointer2, label: 'Clicked "Pay Now"',      t: "4s ago",  c: "text-cyan-600" },
                  { icon: Terminal,      label: "JS Error thrown",        t: "3s ago",  c: "text-red-400" },
                ].map(({ icon: Icon, label, t, c }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Icon size={10} className={`mt-px shrink-0 ${c}`} />
                    <span className="text-slate-400 flex-1 truncate">{label}</span>
                    <span className="text-slate-500 shrink-0">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Deep Technical Context */}
          <motion.div variants={fadeUp}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] p-6
                       hover:border-slate-300 transition-all duration-300 group">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20
                            flex items-center justify-center text-violet-400 mb-4">
              <Terminal size={17} />
            </div>
            <div className="text-[0.65rem] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
              Card 2
            </div>
            <h3 className="font-bold text-[1.05rem] text-slate-900 tracking-tight mb-2">
              Deep Technical Context
            </h3>
            <p className="text-[0.82rem] text-slate-600 leading-relaxed mb-4">
              Every report includes the last N console logs, any uncaught JS errors,
              and all network requests with status codes and timings. No more guessing.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden font-mono text-[0.67rem]">
              {[
                { level: "error", text: "Uncaught TypeError: stripe is undefined",  lc: "bg-red-500/15 text-red-400 border-red-500/25" },
                { level: "warn",  text: "Stripe.js loaded after DOMContentLoaded",  lc: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
                { level: "net",   text: "POST /api/checkout → 422  ·  1 240ms",     lc: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
              ].map(({ level, text, lc }, i) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 ${i ? "border-t border-slate-200" : ""}`}>
                  <span className={`shrink-0 px-1.5 py-[2px] rounded text-[0.58rem] font-bold uppercase border ${lc}`}>
                    {level}
                  </span>
                  <span className="text-slate-600 break-all">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3 — Zero-Config SDK */}
          <motion.div variants={fadeUp}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] p-6
                       hover:border-slate-300 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25
                            flex items-center justify-center text-emerald-600 mb-4">
              <Package size={17} />
            </div>
            <div className="text-[0.65rem] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
              Card 3
            </div>
            <h3 className="font-bold text-[1.05rem] text-slate-900 tracking-tight mb-2">
              Zero-Config SDK
            </h3>
            <p className="text-[0.82rem] text-slate-600 leading-relaxed mb-4">
              One script tag. Under 5 KB gzipped. Deferred loading so it never touches
              your Core Web Vitals. Works with React, Next.js, Laravel, Rails — anything.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-900
                            p-3 font-mono text-[0.68rem] overflow-x-auto text-slate-300">
              <div className="text-slate-500 mb-0.5">{/* before closing body tag */}</div>
              <div>
                <span className="text-emerald-400">&lt;script</span>{" "}
                <span className="text-slate-400">src=</span>
                <span className="text-cyan-400">&quot;cdn.whisper.dev/v1/w.js&quot;</span>
                <br />
                <span className="ml-3 text-slate-400">data-key=</span>
                <span className="text-amber-300">&quot;wsp_live_xxxx&quot;</span>
                <span className="text-emerald-400">&gt;&lt;/script&gt;</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[0.7rem] text-slate-500">
              <span className="flex items-center gap-1.5"><Gauge size={11} /> &lt;5 KB</span>
              <span className="flex items-center gap-1.5"><Zap size={11} /> Deferred</span>
              <span className="flex items-center gap-1.5"><Check size={11} /> Any stack</span>
            </div>
          </motion.div>

          {/* Card 4 — Identify Users */}
          <motion.div variants={fadeUp}
            className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] p-6
                       hover:border-slate-300 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_100%_at_0%_50%,rgba(126,232,162,0.04)_0%,transparent_70%)]" />
            <div className="relative flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20
                                flex items-center justify-center text-amber-400 mb-4">
                  <User size={17} />
                </div>
                <div className="text-[0.65rem] font-mono text-slate-500 uppercase tracking-widest mb-1.5">
                  Card 4
                </div>
                <h3 className="font-bold text-[1.1rem] text-slate-900 tracking-tight mb-2">
                  Identify Your Users
                </h3>
                <p className="text-[0.83rem] text-slate-600 leading-relaxed max-w-sm">
                  Call <code className="text-cyan-700 bg-slate-100 px-1.5 py-0.5 rounded text-[0.75rem]">
                    Whisper.identify(user)
                  </code> once after login and every report automatically
                  includes their email, ID, and plan — so you know exactly who hit the bug.
                </p>
              </div>
              <div className="md:w-64 shrink-0 rounded-xl border border-slate-200
                              bg-slate-900 p-4 font-mono text-[0.68rem] self-start text-slate-300">
                <div className="text-slate-500 mb-2">// After user logs in</div>
                <div>
                  <span className="text-cyan-400">Whisper</span>
                  <span className="text-slate-400">.identify</span>
                  <span className="text-slate-400">(&#123;</span>
                </div>
                <div className="ml-3 space-y-0.5">
                  <div><span className="text-emerald-400">id</span><span className="text-slate-400">:</span> <span className="text-amber-300">&quot;usr_8f2a91&quot;</span><span className="text-slate-500">,</span></div>
                  <div><span className="text-emerald-400">email</span><span className="text-slate-400">:</span> <span className="text-amber-300">&quot;sarah@acme.com&quot;</span><span className="text-slate-500">,</span></div>
                  <div><span className="text-emerald-400">plan</span><span className="text-slate-400">:</span> <span className="text-amber-300">&quot;pro&quot;</span></div>
                </div>
                <div><span className="text-slate-400">&#125;)</span></div>
                <div className="mt-3 pt-3 border-t border-white/10 text-slate-500">
                  // Every future report includes ↑
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   INTEGRATIONS
═══════════════════════════════════════════════════════ */

/* Inline SVG logos so there are zero external deps */
const SlackLogo  = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
);
const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);
const LinearLogo = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857l36.5093 36.5093c.6889.6889.0915 1.8189-.857 1.5964C20.0515 94.4, 5.5765 79.925 1.22541 61.5228zM.00189 46.8891c-.01189-.5803.22489-1.1208.64258-1.5385L46.3506.64058C46.7683.22289 47.3088-.01391 47.8891.00189 60.9243.48 73.1079 6.4727 81.8274 16.1646L16.1646 81.8274C6.47274 73.1079.480004 60.9243.00189 46.8891zM99.9981 53.1109c.0119.5803-.2249 1.1208-.6426 1.5385L53.6494 99.3594c-.4177.4177-.9582.6545-1.5385.6387-13.0352-.4781-25.2188-6.4708-33.9383-16.1627L83.8354 18.1729c9.6919 8.7195 15.6846 20.9031 16.1627 33.9380z"/>
  </svg>
);
const DiscordLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const INTEGRATIONS = [
  { name: "Slack",   Logo: SlackLogo,  desc: "Instant channel alerts", color: "#4A154B", text: "#E01E5A" },
  { name: "GitHub",  Logo: GitHubLogo, desc: "Auto-open issues",       color: "#161B22", text: "#ffffff" },
  { name: "Linear",  Logo: LinearLogo, desc: "Create tickets fast",    color: "#5E6AD2", text: "#ffffff" },
  { name: "Discord", Logo: DiscordLogo,desc: "Team notifications",     color: "#5865F2", text: "#ffffff" },
];

function Integrations() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <SectionEyebrow>Integrations</SectionEyebrow>
          <motion.h2 variants={fadeUp}
            className="font-bold text-[clamp(1.7rem,3.5vw,2.6rem)] text-slate-900 tracking-tight mb-3">
            Fits right into your workflow.
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-[0.88rem] text-slate-600 max-w-md mx-auto mb-12">
            Send bug alerts wherever your team already lives. One toggle in the dashboard.
          </motion.p>

          <motion.div variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS.map(({ name, Logo, desc, color, text }) => (
              <motion.div
                key={name}
                whileHover={{ y: -3, scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl
                           border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04]
                           hover:border-slate-300 transition-all duration-200 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color, color: text }}>
                  <Logo />
                </div>
                <div className="text-left">
                  <div className="text-[0.82rem] font-semibold text-slate-900">{name}</div>
                  <div className="text-[0.68rem] text-slate-500">{desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp}
            className="mt-8 text-[0.75rem] text-slate-500">
            Email webhooks and more integrations coming soon.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS (2-up)
═══════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    quote: "I used to spend 3–4 hours a week just emailing users asking for more info. Whisper killed that entirely. Now I open the dashboard and everything is already there. It's like having a co-founder watching prod 24/7.",
    name: "Theo Marchand", handle: "@theomarchand", role: "Founder @ Formly.io",
    initials: "TM", color: "#0891b2",
  },
  {
    quote: "Honestly thought I'd just use Sentry. Then I saw Whisper — it's 10× simpler and the session replay is incredible. Found a race condition in my Stripe integration in under 5 minutes. That used to take me a full day.",
    name: "Priya Rao", handle: "@priyabuilds", role: "Indie Hacker · Builder",
    initials: "PR", color: "#34d399",
  },
];

function Testimonials() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <div className="text-center mb-12">
            <SectionEyebrow>Testimonials</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-bold text-[clamp(1.7rem,3.5vw,2.6rem)] text-slate-900 tracking-tight">
              Loved by indie hackers.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.map(t => (
              <motion.div key={t.handle} variants={fadeUp}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] p-6
                           hover:border-slate-300 transition-all duration-300 flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-[0.85rem] text-slate-700 leading-relaxed flex-1 mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center
                                  text-[0.72rem] font-bold text-white shrink-0"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[0.83rem] font-semibold text-slate-900">{t.name}</div>
                    <div className="text-[0.7rem] text-slate-500">{t.handle} · {t.role}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-[0.62rem] font-mono
                                  text-emerald-600 bg-emerald-500/10 border border-emerald-500/25
                                  px-2 py-1 rounded-full">
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
const PLANS = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "For side projects and exploring Whisper.",
    cta: "Start for Free", solid: false,
    features: [
      "100 reports / month",
      "1 project",
      "Session timeline (last 30s)",
      "Console + JS error capture",
      "Basic dashboard",
      "7-day history",
    ],
  },
  {
    name: "Pro", price: "$19", period: "/ month",
    desc: "For founders who ship fast and need to fix faster.",
    cta: "Start 14-Day Trial", solid: true, badge: "Most Popular",
    features: [
      "Unlimited reports",
      "Unlimited projects",
      "Full network request capture",
      "User identification",
      "Slack, Discord & Linear alerts",
      "90-day history",
      "Priority support",
      "Custom widget branding",
    ],
  },
] as const;

function Pricing() {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="pricing" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <div className="text-center mb-14">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-bold text-[clamp(1.9rem,4vw,3rem)] text-slate-900 tracking-tight">
              Simple, honest pricing.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-600 text-[0.88rem] mt-2">
              No seats. No per-event billing. Cancel any time.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {PLANS.map(plan => (
              <motion.div key={plan.name} variants={fadeUp}
                className={`relative rounded-2xl p-7 flex flex-col transition-all duration-300 ${
                  plan.solid
                    ? "border border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.08] to-white shadow-xl shadow-cyan-600/10"
                    : "border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] hover:border-slate-300"
                }`}>
                {"badge" in plan && plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1
                                  rounded-full bg-cyan-600 text-white
                                  text-[0.62rem] font-bold tracking-wide uppercase
                                  shadow-md shadow-cyan-600/25">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-[0.68rem] font-mono font-semibold text-slate-500
                                  uppercase tracking-widest mb-3">{plan.name}</div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="font-bold text-[2.6rem] text-slate-900 leading-none">{plan.price}</span>
                    <span className="text-slate-500 text-sm mb-1.5">{plan.period}</span>
                  </div>
                  <p className="text-[0.8rem] text-slate-600">{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={13} className={`mt-0.5 shrink-0 ${plan.solid ? "text-cyan-600" : "text-emerald-600"}`} />
                      <span className="text-[0.81rem] text-slate-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.a href="#"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={`block text-center py-3 rounded-xl text-[0.86rem] font-bold
                              transition-all duration-200 ${
                    plan.solid
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/25 hover:bg-cyan-500"
                      : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                  }`}>
                  {plan.cta}
                </motion.a>
              </motion.div>
            ))}
          </div>
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
    a: "No. The Whisper script is under 5 KB gzipped and loads with the defer attribute — it never blocks rendering, never affects your Largest Contentful Paint, and has zero impact on Core Web Vitals. We built it obsessively lightweight.",
  },
  {
    q: "What about user privacy? Are you recording keystrokes?",
    a: "Absolutely not. Whisper tracks interaction types and element identifiers (e.g. \"Typed in #email-input\"), never the actual values. Passwords, payment fields, and any input values are never captured. You can additionally mark any element with data-whisper-ignore and we will skip it entirely.",
  },
  {
    q: "Does it work with React / Next.js?",
    a: "Yes — and everything else. Whisper is a plain JavaScript snippet with no framework dependency. It works with React, Next.js, Vue, Svelte, Laravel Blade, Rails ERB, plain HTML, whatever you ship.",
  },
  {
    q: "What's the difference between Whisper and Sentry?",
    a: "Sentry is a full error monitoring platform with a steep learning curve and pricing that scales uncomfortably. Whisper focuses on one thing: giving you enough context to fix a bug the first time a user reports it — session replay, network calls, and logs in one place, instantly, without a complex setup.",
  },
  {
    q: "How does the 30-second session replay work?",
    a: "Whisper keeps a rolling 30-second buffer of DOM events (clicks, navigation, debounced inputs) in memory. When a user submits feedback, it flushes this buffer into the report payload. No video recording, no server streaming — just a structured timeline of what the user did right before the issue.",
  },
  {
    q: "Can I self-host Whisper?",
    a: "A self-hosted / on-premise option is on the roadmap. Sign up for free to get notified when it launches. Enterprise plans with custom data residency are available — reach out.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="faq" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <div className="text-center mb-12">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <motion.h2 variants={fadeUp}
              className="font-bold text-[clamp(1.9rem,4vw,3rem)] text-slate-900 tracking-tight">
              Honest answers.
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  open === i
                    ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                    : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
                }`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4
                             px-5 py-4 text-left"
                >
                  <span className={`text-[0.88rem] font-semibold transition-colors duration-200 ${
                    open === i ? "text-slate-900" : "text-slate-700"
                  }`}>
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`shrink-0 transition-colors duration-200 ${
                      open === i ? "text-cyan-600" : "text-slate-500"
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
                      <p className="px-5 pb-5 text-[0.83rem] text-slate-600 leading-relaxed">
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
    <section ref={ref} className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(8,145,178,0.1)_0%,transparent_70%)]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <motion.p variants={fadeUp}
            className="text-[0.72rem] font-mono text-slate-500 mb-5 tracking-widest uppercase">
            Free to start · No credit card required
          </motion.p>
          <motion.h2 variants={fadeUp}
            className="font-bold text-[clamp(2.2rem,5vw,3.8rem)] text-slate-900 tracking-tight leading-[1.05] mb-5">
            Ready to save hours
            <br />
            <span className="bg-gradient-to-r from-cyan-600 to-emerald-500 bg-clip-text text-transparent">
              on debugging?
            </span>
          </motion.h2>
          <motion.p variants={fadeUp}
            className="text-slate-600 text-[0.92rem] leading-relaxed mb-10 max-w-md mx-auto">
            Join hundreds of indie hackers who ship with confidence. Add one script tag
            and you&apos;ll never ask &ldquo;what browser were you using?&rdquo; again.
          </motion.p>
          <motion.div variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.a href="#pricing"
              whileHover={{ scale: 1.04, boxShadow: "0 12px 48px rgba(8,145,178,0.35)" }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-xl
                         bg-cyan-600 text-white font-bold text-[0.92rem]
                         shadow-md shadow-cyan-600/25 hover:bg-cyan-500">
              Get Started for Free
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.a>
            <a href="#demo"
              className="text-[0.84rem] text-slate-600 hover:text-slate-800 transition-colors
                         underline underline-offset-4 decoration-slate-300">
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
    <footer className="border-t border-slate-200 bg-white/50 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-cyan-600" fill="currentColor" />
          <span className="font-bold text-[0.95rem] text-slate-900 tracking-tight">Whisper</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {["Features", "Pricing", "Docs", "Blog", "Changelog", "Status", "Privacy"].map(l => (
            <a key={l} href="#"
              className="text-[0.76rem] text-slate-500 hover:text-slate-600 transition-colors">
              {l}
            </a>
          ))}
        </nav>
        <div className="text-right">
          <p className="text-[0.72rem] text-slate-500">
            Built by an indie hacker.{" "}
            <span className="text-slate-500">For indie hackers.</span>
          </p>
          <p className="text-[0.66rem] text-slate-600 mt-0.5">
            © {new Date().getFullYear()} Whisper. All rights reserved.
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
    <main className="relative min-h-screen bg-slate-50 text-slate-900">
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
      <div className="relative z-10">
      <Navbar />

      <Hero />
      <Divider />

      <Comparison />
      <Divider />

      <Features />
      <Divider />

      {/* Live Demo Section */}
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

      {/* Floating feedback widget — always visible */}
      <WhisperWidgetDemo />
      </div>
    </main>
  );
}
