import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type StatusType } from "./StatusBadge";
import { Clock, User } from "lucide-react";

interface StatusDisplayProps {
  currentStatus: StatusType;
  lastUpdated: Date;
  technicianName?: string;
}

export function StatusDisplay({ currentStatus, lastUpdated, technicianName = "IT Support" }: StatusDisplayProps) {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusMessage = (status: StatusType) => {
    switch (status) {
      case "available":
        return "Ready to help with your technical issues";
      case "away":
        return "Temporarily unavailable - back soon";
      case "assisting":
        return "Currently helping another user";
      case "offline":
        return "Not available at this time";
      default:
        return "Status unknown";
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg" data-testid="text-technician-name">
            {technicianName}
          </CardTitle>
        </div>
        <div className="flex justify-center">
          <StatusBadge status={currentStatus} size="lg" />
        </div>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground" data-testid="text-status-message">
          {getStatusMessage(currentStatus)}
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span data-testid="text-last-updated">
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}