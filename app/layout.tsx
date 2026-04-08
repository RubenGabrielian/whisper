import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased noise-overlay">
        {children}
        <Script
          src="http://localhost:3000/api/embed/sdk"
          data-id="wsp_live_876d451c4f7b4acaa0ee4a6a"
          async
        />
      </body>
    </html>
  );
}
