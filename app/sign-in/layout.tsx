import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Whybug",
  description: "Sign in with Google or a one-time email code.",
};
  
export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
