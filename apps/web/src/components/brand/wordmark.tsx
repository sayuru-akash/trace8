import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight",
        sizeClasses[size],
        className
      )}
    >
      Trace
      <span className="text-gradient-primary">8</span>
    </span>
  );
}
