import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { 
  Users, 
  Search, 
  RefreshCw, 
  Copy, 
  Key, 
  CheckCircle2,
  Clock,
  User,
  Globe,
  Trash2
} from "lucide-react";
import type { Session, UpdateSession } from "@shared/schema";

export function SessionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [securityCodeInputs, setSecurityCodeInputs] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sessions with real-time polling
  const { data: sessions = [], isLoading, refetch } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });

  // Set security code mutation
  const setCodeMutation = useMutation({
    mutationFn: async ({ sessionId, securityCode }: { sessionId: string; securityCode: string }): Promise<Session> => {
      const response = await fetch(`/api/sessions/${sessionId}/security-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ securityCode }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to set security code");
      }
      
      return response.json();
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/sessions", updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      // Clear the input after successful update
      setSecurityCodeInputs(prev => ({ ...prev, [updatedSession.id]: "" }));
      toast({
        title: "Security code set",
        description: `Code: ${updatedSession.securityCode}`,
      });
    },
    onError: (error) => {
      console.error("Failed to set security code:", error);
      toast({
        title: "Error",
        description: "Failed to set security code. Code must be 6 alphanumeric characters.",
        variant: "destructive",
      });
    },
  });

  // Update session status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSession }): Promise<Session> => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update session");
      }
      
      return response.json();
    },
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["/api/sessions", updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session updated",
        description: "Session status has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update session:", error);
      toast({
        title: "Error",
        description: "Failed to update session.",
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session deleted",
        description: "The session has been removed.",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/sessions", {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "All sessions cleared",
        description: "All session history has been deleted.",
      });
    },
  });

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session) =>
    session.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast({
        title: "Copied!",
        description: "Security code copied to clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleStatusChange = (sessionId: string, newStatus: string) => {
    updateStatusMutation.mutate({
      id: sessionId,
      updates: { status: newStatus as any },
    });
  };

  const getStepProgress = (session: Session) => {
    const steps = [
      session.step1Completed,
      session.step2Completed, 
      session.step3Completed,
      session.step4Completed,
      session.step5Completed,
      session.step6Completed,
      session.step7Completed,
      session.step8Completed,
    ];
    const completed = steps.filter(Boolean).length;
    return { completed, total: steps.length };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Session Management
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage customer support sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to clear all session history?")) {
                clearAllMutation.mutate();
              }
            }}
            disabled={clearAllMutation.isPending}
            className="gap-2"
          >
            Clear All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
            data-testid="button-refresh-sessions"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, or session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              data-testid="input-search-sessions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No sessions found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No sessions match your search." : "No customer sessions available."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => {
            const progress = getStepProgress(session);
            const progressPercentage = (progress.completed / progress.total) * 100;
            
            return (
              <Card key={session.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-customer-name-${session.id}`}>
                          {session.customerName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground" data-testid={`text-session-id-${session.id}`}>
                          Session: {session.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Delete this session?")) {
                            deleteSessionMutation.mutate(session.id);
                          }
                        }}
                        disabled={deleteSessionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <SessionStatusBadge status={session.status} />
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {session.language?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {session.customerEmail && (
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span data-testid={`text-customer-email-${session.id}`}>{session.customerEmail}</span>
                      </div>
                    )}
                    {session.computerInfo && (
                      <div>
                        <span className="text-muted-foreground">Computer: </span>
                        <span data-testid={`text-computer-info-${session.id}`}>{session.computerInfo}</span>
                      </div>
                    )}
                  </div>

                  {session.issueDescription && (
                    <div className="text-sm p-3 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-muted-foreground font-medium mb-1">Issue Description:</p>
                      <p className="whitespace-pre-wrap" data-testid={`text-issue-description-${session.id}`}>
                        {session.issueDescription}
                      </p>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground" data-testid={`text-progress-${session.id}`}>
                        {progress.completed}/{progress.total} steps
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Security code section */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      <span className="font-medium">Security Code:</span>
                      {session.securityCode ? (
                        <Badge variant="secondary" className="font-mono" data-testid={`text-security-code-${session.id}`}>
                          {session.securityCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {session.securityCode ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(session.securityCode!)}
                          className="gap-1"
                          data-testid={`button-copy-code-${session.id}`}
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="6-digit code"
                            value={securityCodeInputs[session.id] || ""}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase().slice(0, 6);
                              setSecurityCodeInputs(prev => ({ ...prev, [session.id]: value }));
                            }}
                            className="w-24 h-8 text-xs font-mono"
                            data-testid={`input-security-code-${session.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const code = securityCodeInputs[session.id];
                              if (code && code.length === 6) {
                                setCodeMutation.mutate({ sessionId: session.id, securityCode: code });
                              } else {
                                toast({
                                  title: "Invalid code",
                                  description: "Security code must be exactly 6 characters.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={setCodeMutation.isPending || !securityCodeInputs[session.id] || securityCodeInputs[session.id].length !== 6}
                            className="gap-1"
                            data-testid={`button-set-code-${session.id}`}
                          >
                            <Key className="w-3 h-3" />
                            Set Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Created: {formatDate(session.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.status === "preparing" && progress.completed === progress.total && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(session.id, "ready")}
                          disabled={updateStatusMutation.isPending}
                          className="gap-1"
                          data-testid={`button-mark-ready-${session.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Mark Ready
                        </Button>
                      )}
                      {session.status === "ready" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(session.id, "in_progress")}
                          disabled={updateStatusMutation.isPending}
                          className="gap-1"
                          data-testid={`button-start-session-${session.id}`}
                        >
                          Start Session
                        </Button>
                      )}
                      {session.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(session.id, "completed")}
                          disabled={updateStatusMutation.isPending}
                          className="gap-1"
                          data-testid={`button-complete-session-${session.id}`}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}