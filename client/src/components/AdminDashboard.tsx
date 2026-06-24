import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge, type StatusType } from "./StatusBadge";
import {
  LogOut,
  Settings,
  Clock,
  Users,
  MonitorSpeaker,
  BarChart3,
  Shield,
  Key,
  UserPlus,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionManagement } from "./SessionManagement";
import { QuickAssistWorkflow } from "./QuickAssistWorkflow";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminDashboardProps {
  currentStatus: StatusType;
  onStatusChange: (status: StatusType) => void;
  onLogout: () => void;
  lastUpdated: Date;
  isUpdating?: boolean;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  today: number;
}

interface AuditEntry {
  id: string;
  adminUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  username: string;
}

interface StorageInfo {
  type: "sqlserver" | "memory";
  server: string | null;
  database: string | null;
}

export function AdminDashboard({
  currentStatus,
  onStatusChange,
  onLogout,
  lastUpdated,
  isUpdating = false,
}: AdminDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    refetchInterval: 10000,
  });

  // Audit log
  const { data: auditLog = [], refetch: refetchAudit } = useQuery<AuditEntry[]>({
    queryKey: ["/api/audit-log"],
  });

  // Admin users
  const { data: adminUsers = [], refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  // Storage info
  const { data: storageInfo } = useQuery<StorageInfo>({
    queryKey: ["/api/storage-info"],
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: newUsername, password: newUserPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin user created", description: `User '${newUsername}' created.` });
      setNewUsername("");
      setNewUserPassword("");
      refetchUsers();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      toast({ title: "User deleted" });
      refetchUsers();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (newStatus: StatusType) => {
    if (isUpdating) return;
    onStatusChange(newStatus);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate();
  };

  const statusOptions: { status: StatusType; label: string; description: string }[] = [
    { status: "available", label: "Available", description: "Ready to assist users" },
    { status: "away", label: "Away", description: "Temporarily unavailable" },
    { status: "assisting", label: "Currently Assisting", description: "Helping another user" },
    { status: "offline", label: "Offline", description: "Not available" },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      status_change: "Status Changed",
      security_code_set: "Security Code Set",
      session_deleted: "Session Deleted",
      all_sessions_cleared: "All Sessions Cleared",
      admin_user_created: "Admin User Created",
      admin_user_deleted: "Admin User Deleted",
      password_changed: "Password Changed",
    };
    return labels[action] || action;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-admin-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage customer sessions and support operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {storageInfo && (
              <Badge variant={storageInfo.type === "sqlserver" ? "default" : "secondary"} className="gap-1">
                <Database className="w-3 h-3" />
                {storageInfo.type === "sqlserver"
                  ? `SQL Server: ${storageInfo.database}`
                  : "In-Memory"}
              </Badge>
            )}
            <Button variant="outline" onClick={onLogout} className="gap-2" data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Sessions", value: stats.total, icon: Users },
              { label: "Active Now", value: stats.active, icon: Activity },
              { label: "Completed", value: stats.completed, icon: CheckCircle },
              { label: "Today", value: stats.today, icon: BarChart3 },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <Icon className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sessions" className="flex items-center gap-2" data-testid="tab-sessions">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2" data-testid="tab-workflow">
              <MonitorSpeaker className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Assist</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2" data-testid="tab-status">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <SessionManagement />
          </TabsContent>

          {/* Quick Assist Tab */}
          <TabsContent value="workflow">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSpeaker className="w-5 h-5" />
                  Microsoft Quick Assist Workflow
                </CardTitle>
                <p className="text-muted-foreground">
                  Admin-only access to Quick Assist workflow and session management
                </p>
              </CardHeader>
              <CardContent>
                <QuickAssistWorkflow />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <StatusBadge status={currentStatus} size="lg" />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span data-testid="text-admin-last-updated">
                      Last updated: {lastUpdated.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {statusOptions.map((option) => (
                    <div
                      key={option.status}
                      className={`p-4 border rounded-md hover-elevate cursor-pointer transition-all ${
                        currentStatus === option.status ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => handleStatusChange(option.status)}
                      data-testid={`button-status-${option.status}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{option.label}</h3>
                        {currentStatus === option.status && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      <Button
                        variant={currentStatus === option.status ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={isUpdating}
                      >
                        {isUpdating && currentStatus === option.status ? "Updating..." : "Set Status"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Audit Log
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {storageInfo?.type !== "sqlserver" && (
                      <Badge variant="secondary">Requires SQL Server</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => refetchAudit()} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Track all admin actions and system events
                </p>
              </CardHeader>
              <CardContent>
                {storageInfo?.type !== "sqlserver" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Audit log requires SQL Server</p>
                    <p className="text-sm mt-1">Configure SQL_SERVER environment variables to enable this feature.</p>
                  </div>
                ) : auditLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No audit events yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex flex-wrap items-start gap-3 p-3 border border-border rounded-md text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{actionLabel(entry.action)}</Badge>
                            <span className="font-medium">{entry.adminUsername}</span>
                            {entry.details && (
                              <span className="text-muted-foreground truncate">{entry.details}</span>
                            )}
                          </div>
                          {entry.targetId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {entry.targetType} / {entry.targetId}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-muted-foreground text-xs shrink-0">
                          <p>{formatDate(entry.createdAt)}</p>
                          {entry.ipAddress && <p>{entry.ipAddress}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <p className="text-muted-foreground text-sm">Update your admin account password</p>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="gap-2"
                >
                  <Key className="w-4 h-4" />
                  {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Admin User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Admin Users
                </CardTitle>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm">Manage admin accounts</p>
                  {storageInfo?.type !== "sqlserver" && (
                    <Badge variant="secondary" className="text-xs">Requires SQL Server</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing users */}
                <div className="space-y-2">
                  {adminUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{u.username}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete admin user '${u.username}'?`)) {
                            deleteUserMutation.mutate(u.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending || storageInfo?.type !== "sqlserver"}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Create new user */}
                {storageInfo?.type === "sqlserver" ? (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-sm font-medium">Create New Admin</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Username</Label>
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Username"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Password</Label>
                        <Input
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Password (min 8 chars)"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (!newUsername || !newUserPassword) {
                          toast({ title: "Error", description: "Username and password required.", variant: "destructive" });
                          return;
                        }
                        createUserMutation.mutate();
                      }}
                      disabled={createUserMutation.isPending}
                      className="gap-2"
                      size="sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      {createUserMutation.isPending ? "Creating..." : "Create Admin"}
                    </Button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Multiple admin user management requires SQL Server. Configure the SQL_SERVER environment variable to enable this feature.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Storage Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storageInfo ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant={storageInfo.type === "sqlserver" ? "default" : "secondary"}>
                        {storageInfo.type === "sqlserver" ? "SQL Server" : "In-Memory"}
                      </Badge>
                    </div>
                    {storageInfo.server && (
                      <div>
                        <span className="text-muted-foreground">Server: </span>
                        <span className="font-mono">{storageInfo.server}</span>
                      </div>
                    )}
                    {storageInfo.database && (
                      <div>
                        <span className="text-muted-foreground">Database: </span>
                        <span className="font-mono">{storageInfo.database}</span>
                      </div>
                    )}
                    {storageInfo.type === "memory" && (
                      <p className="mt-3 text-muted-foreground">
                        Data is stored in memory only and will be lost on server restart. Set
                        SQL_SERVER and SQL_DATABASE environment variables to enable persistent SQL Server storage.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
