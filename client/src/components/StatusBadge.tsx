import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

export type StatusType = "available" | "away" | "assisting" | "offline";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "default" | "lg";
}

const statusConfig = {
  available: {
    label: "Available",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dotColor: "text-emerald-500",
  },
  away: {
    label: "Away",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20", 
    dotColor: "text-amber-500",
  },
  assisting: {
    label: "Currently Assisting",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dotColor: "text-rose-500",
  },
  offline: {
    label: "Offline",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    dotColor: "text-slate-500",
  },
};

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} gap-2 border shadow-sm ${size === "lg" ? "text-base px-4 py-2" : ""}`}
      data-testid={`status-badge-${status}`}
    >
      <Circle className={`w-2 h-2 fill-current animate-pulse ${config.dotColor}`} />
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
}