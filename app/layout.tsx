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
  title: "Whybug — Zero-Config Bug Reporting",
  description:
    "Stop asking 'What browser were you using?'. Whybug captures full technical context — console logs, network errors, session info — when users submit feedback.",
  keywords: ["bug reporting", "developer tools", "indie hacker", "SaaS"],
  openGraph: {
    title: "Whybug — Zero-Config Bug Reporting",
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
        className={`${archivo.variable} ${ibmPlexMono.variable} min-h-screen font-display antialiased`}
      >
        {children}
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          src="https://plausible.io/js/pa-RCHvOgfg2cm-3Crpz8lPo.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`
window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()
          `.trim()}
        </Script>
      </body>
    </html>
  );
}
