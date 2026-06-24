import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

export type SessionStatusType = "preparing" | "ready" | "in_progress" | "completed";

interface SessionStatusBadgeProps {
  status: SessionStatusType;
  size?: "sm" | "default" | "lg";
}

const sessionStatusConfig = {
  preparing: {
    label: "Preparing",
    color: "bg-chart-4 text-white",
    dotColor: "text-chart-4",
  },
  ready: {
    label: "Ready",
    color: "bg-chart-1 text-white",
    dotColor: "text-chart-1",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-chart-2 text-white", 
    dotColor: "text-chart-2",
  },
  completed: {
    label: "Completed",
    color: "bg-chart-3 text-white",
    dotColor: "text-chart-3",
  },
};

export function SessionStatusBadge({ status, size = "default" }: SessionStatusBadgeProps) {
  const config = sessionStatusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={`${config.color} gap-2 ${size === "lg" ? "text-base px-4 py-2" : ""}`}
      data-testid={`session-status-badge-${status}`}
    >
      <Circle className={`w-2 h-2 fill-current ${config.dotColor}`} />
      {config.label}
    </Badge>
  );
}