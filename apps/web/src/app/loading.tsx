export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <span className="font-display text-4xl font-bold tracking-tight text-primary animate-pulse">
            Trace8
          </span>
        </div>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Playwright Testing Studio
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
}
