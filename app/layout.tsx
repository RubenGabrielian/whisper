import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Whisper — Zero-Config Bug Reporting",
  description:
    "Stop asking 'What browser were you using?'. Whisper captures full technical context — console logs, network errors, session info — when users submit feedback.",
  keywords: ["bug reporting", "developer tools", "indie hacker", "SaaS"],
  openGraph: {
    title: "Whisper — Zero-Config Bug Reporting",
    description:
      "Capture full technical context when users submit feedback. One script tag. Zero config.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body
        className={`${archivo.variable} ${ibmPlexMono.variable} min-h-screen bg-[#FFFBF0] text-zinc-950 font-display antialiased noise-overlay`}
      >
        {children}
        <Script
          src="http://localhost:3000/api/embed/sdk"
          data-id="wsp_live_876d451c4f7b4acaa0ee4a6a"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  );
}
