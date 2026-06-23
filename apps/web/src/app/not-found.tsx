import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="font-display text-4xl font-bold tracking-tight text-primary">
          Trace8
        </span>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Playwright Testing Studio
        </span>
      </div>

      <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Page not found. The page you are looking for does not exist or has been
        moved.
      </p>

      <Link
        href="/dashboard"
        className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
