import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Page not found</h1>
      <Link
        href="/"
        className="mt-6 text-sm font-semibold text-primary hover:underline"
      >
        Back home
      </Link>
    </div>
  );
}
