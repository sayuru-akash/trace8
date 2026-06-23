import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  MinusCircle,
  AlertTriangle,
  CloudOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "success" | "danger" | "warning" | "info" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  passed: { label: "Passed", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "danger", icon: XCircle },
  timed_out: { label: "Timed Out", variant: "warning", icon: Clock },
  cancelled: { label: "Cancelled", variant: "outline", icon: Ban },
  skipped: { label: "Skipped", variant: "outline", icon: MinusCircle },
  flaky: { label: "Flaky", variant: "warning", icon: AlertTriangle },
  upload_failed: {
    label: "Upload Failed",
    variant: "danger",
    icon: CloudOff,
  },
  interrupted: { label: "Interrupted", variant: "outline", icon: Ban },
  unknown: { label: "Unknown", variant: "outline", icon: MinusCircle },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs gap-1 px-2 py-0.5",
    md: "text-xs gap-1.5 px-2.5 py-0.5",
    lg: "text-sm gap-2 px-3 py-1",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], className)}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
