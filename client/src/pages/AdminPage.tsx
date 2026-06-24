import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/LoginForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useStatus } from "@/hooks/use-status";
import type { StatusType } from "@/components/StatusBadge";

export default function AdminPage() {
  const { user, loginMutation, logoutMutation, isLoading } = useAuth();
  const { status, updateStatus, isUpdating } = useStatus();
  const isAuthenticated = !!user;

  const handleStatusChange = (newStatus: StatusType) => {
    updateStatus(newStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm loginMutation={loginMutation} />;
  }

  return (
    <AdminDashboard
      currentStatus={status?.status || "available"}
      onStatusChange={handleStatusChange}
      onLogout={() => logoutMutation.mutate()}
      lastUpdated={status ? new Date(status.lastUpdated) : new Date()}
      isUpdating={isUpdating}
    />
  );
}