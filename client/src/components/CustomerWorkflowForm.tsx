import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  CheckCircle,
  Circle,
  Copy,
  MonitorSpeaker,
  User,
  Shield,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Session, InsertSession, UpdateSession } from "@shared/schema";

const STORAGE_KEY = "assistflow_session_id";

const customerFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  computerInfo: z.string().optional(),
  issueDescription: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerWorkflowFormProps {
  sessionId?: string;
}

// ── Screen states ─────────────────────────────────────────────────────────────
type Screen =
  | "resume_prompt"   // stored session found — ask: resume or start fresh?
  | "new_form"        // no session — show sign-up form
  | "loading"         // fetching existing session
  | "workflow"        // session loaded, show steps
  | "session_error";  // stored session ID not found on server

export function CustomerWorkflowForm({ sessionId: urlSessionId }: CustomerWorkflowFormProps) {
  const { language, t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine the initial screen
  const storedId = localStorage.getItem(STORAGE_KEY);
  const startingId = urlSessionId || storedId || null;

  const [sessionId, setSessionId] = useState<string | null>(startingId);
  const [screen, setScreen] = useState<Screen>(() => {
    if (!startingId) return "new_form";
    // If came via URL, skip the prompt and go straight to loading
    if (urlSessionId) return "loading";
    return "resume_prompt";
  });

  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    Array(8).fill(false)
  );

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      computerInfo: "",
      issueDescription: "",
    },
  });

  // ── Fetch session ────────────────────────────────────────────────────────

  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
  } = useQuery<Session>({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId && (screen === "loading" || screen === "workflow"),
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    throwOnError: false,   // don't crash on 404 — we handle isError below
    retry: 1,
  });

  // Once session loads successfully → move to workflow screen
  useEffect(() => {
    if (session && screen === "loading") {
      setCompletedSteps([
        session.step1Completed,
        session.step2Completed,
        session.step3Completed,
        session.step4Completed,
        session.step5Completed,
        session.step6Completed,
        session.step7Completed,
        session.step8Completed,
      ]);
      form.setValue("customerName", session.customerName || "");
      if (session.customerEmail) form.setValue("customerEmail", session.customerEmail);
      if (session.computerInfo) form.setValue("computerInfo", session.computerInfo);
      if (session.issueDescription) form.setValue("issueDescription", session.issueDescription);
      setScreen("workflow");
    }
  }, [session, screen, form]);

  // Session not found on server (404 or any error) → show error screen
  useEffect(() => {
    if (sessionError && screen === "loading") {
      setScreen("session_error");
    }
  }, [sessionError, screen]);

  // Also update step data when session polling gives fresh data
  useEffect(() => {
    if (session && screen === "workflow") {
      setCompletedSteps([
        session.step1Completed,
        session.step2Completed,
        session.step3Completed,
        session.step4Completed,
        session.step5Completed,
        session.step6Completed,
        session.step7Completed,
        session.step8Completed,
      ]);
    }
  }, [session, screen]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const createSessionMutation = useMutation({
    mutationFn: async (data: InsertSession): Promise<Session> => {
      const response = await apiRequest("POST", "/api/sessions", data);
      return response.json();
    },
    onSuccess: (newSession: Session) => {
      setSessionId(newSession.id);
      localStorage.setItem(STORAGE_KEY, newSession.id);
      queryClient.setQueryData(["/api/sessions", newSession.id], newSession);
      setCompletedSteps(Array(8).fill(false));
      setScreen("workflow");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSession }): Promise<Session> => {
      const response = await apiRequest("PATCH", `/api/sessions/${id}`, updates);
      return response.json();
    },
    onSuccess: (updatedSession: Session) => {
      queryClient.setQueryData(["/api/sessions", updatedSession.id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update session.", variant: "destructive" });
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const startFresh = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setCompletedSteps(Array(8).fill(false));
    form.reset();
    setScreen("new_form");
  };

  const resumeSession = () => {
    setScreen("loading");
  };

  const handleSubmitInitialForm = (data: CustomerFormData) => {
    createSessionMutation.mutate({
      customerName: data.customerName,
      customerEmail: data.customerEmail || undefined,
      computerInfo: data.computerInfo || undefined,
      issueDescription: data.issueDescription || undefined,
      language,
    });
  };

  const handleStepComplete = (stepIndex: number, completed: boolean) => {
    if (!sessionId) return;

    if (completed) {
      const allPreviousCompleted = completedSteps.slice(0, stepIndex).every(Boolean);
      if (!allPreviousCompleted) {
        toast({
          title: "Complete previous steps first",
          description: "Please complete all previous steps before marking this one.",
          variant: "destructive",
        });
        return;
      }
    }

    const newSteps = [...completedSteps];
    newSteps[stepIndex] = completed;
    setCompletedSteps(newSteps);

    const keys = [
      "step1Completed", "step2Completed", "step3Completed", "step4Completed",
      "step5Completed", "step6Completed", "step7Completed", "step8Completed",
    ] as const;

    const updates: UpdateSession = { [keys[stepIndex]]: completed };
    if (newSteps.every(Boolean)) updates.status = "ready";

    updateSessionMutation.mutate({ id: sessionId, updates });
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast({ title: "Copied", description: "Security code copied to clipboard." });
    } catch {}
  };

  const steps = [
    { title: t.customerForm.step1Prep,  description: t.customerForm.step1PrepDesc },
    { title: t.customerForm.step2Prep,  description: t.customerForm.step2PrepDesc },
    { title: t.customerForm.step3Prep,  description: t.customerForm.step3PrepDesc },
    { title: t.customerForm.qaStep1,    description: "" },
    { title: t.customerForm.qaStep2,    description: "" },
    { title: t.customerForm.qaStep3,    description: t.customerForm.qaStep3Desc || "" },
    { title: t.customerForm.qaStep4,    description: t.customerForm.qaStep4Desc || "" },
    { title: t.customerForm.qaStep5,    description: "" },
  ];

  const completedCount = completedSteps.filter(Boolean).length;
  const progressPct = (completedCount / steps.length) * 100;
  const allDone = completedSteps.every(Boolean);

  // ── Page header shared across screens ────────────────────────────────────

  const PageHeader = ({ showNewSession = false }: { showNewSession?: boolean }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <MonitorSpeaker className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-customer-title">
            {t.customerForm.title}
          </h1>
          <p className="text-muted-foreground text-sm">{t.customerForm.subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showNewSession && (
          <Button variant="outline" size="sm" onClick={startFresh} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            New Session
          </Button>
        )}
        <LanguageSwitcher />
      </div>
    </div>
  );

  // ── Screen: resume prompt ─────────────────────────────────────────────────

  if (screen === "resume_prompt") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Resume Your Session?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We found a previous support session saved on this device. Would you like to continue where you left off, or start a new session?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={resumeSession} className="gap-2 flex-1">
                  <ArrowRight className="w-4 h-4" />
                  Continue Previous Session
                </Button>
                <Button variant="outline" onClick={startFresh} className="gap-2 flex-1">
                  <RotateCcw className="w-4 h-4" />
                  Start New Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Screen: loading ───────────────────────────────────────────────────────

  if (screen === "loading" || (sessionLoading && screen !== "workflow")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading your session...</p>
        <Button variant="ghost" size="sm" onClick={startFresh} className="text-muted-foreground gap-2 mt-2">
          <RotateCcw className="w-3 h-3" />
          Start fresh instead
        </Button>
      </div>
    );
  }

  // ── Screen: session error (not found / server restarted) ──────────────────

  if (screen === "session_error") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                Session Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your previous session could not be found. It may have expired or been removed by the support team. Please start a new session.
              </p>
              <Button onClick={startFresh} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Start New Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Screen: new form ──────────────────────────────────────────────────────

  if (screen === "new_form") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <PageHeader />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t.customerForm.step1Title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitInitialForm)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.customerForm.customerName}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.customerForm.customerNamePlaceholder} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.customerForm.customerEmail}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder={t.customerForm.customerEmailPlaceholder} data-testid="input-customer-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="computerInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.customerForm.computerInfo}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t.customerForm.computerInfoPlaceholder} data-testid="input-computer-info" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issueDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.customerForm.issueDescription}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t.customerForm.issueDescriptionPlaceholder} rows={3} data-testid="textarea-issue-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createSessionMutation.isPending} data-testid="button-start-session">
                    {createSessionMutation.isPending ? "Creating session..." : t.continue}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Screen: workflow ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader showNewSession />

        {/* Progress bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" data-testid="text-progress">
                    {completedCount} / {steps.length} {t.complete}
                  </Badge>
                  {session?.customerName && (
                    <span className="text-sm text-muted-foreground">
                      — {session.customerName}
                    </span>
                  )}
                </div>
                {allDone && (
                  <Badge className="bg-chart-1 text-white">
                    {t.customerForm.sessionReady}
                  </Badge>
                )}
              </div>
              <Progress value={progressPct} className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Security code */}
        {session && (
          <Card className={allDone ? "border-chart-1" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t.customerForm.securityCodeTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t.customerForm.securityCodeDesc}</p>
              <div className="flex gap-2">
                <Input
                  value={session.securityCode || ""}
                  placeholder={t.customerForm.securityCodePlaceholder}
                  readOnly
                  className="flex-1 font-mono text-lg text-center"
                  data-testid="input-security-code"
                />
                {session.securityCode && (
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(session.securityCode!)} data-testid="button-copy-code">
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {!allDone && (
                <p className="text-sm text-muted-foreground mt-2">{t.customerForm.waitingForCode}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[index];
            const isLocked = !isCompleted && !completedSteps.slice(0, index).every(Boolean);

            return (
              <Card
                key={index}
                className={`transition-all ${isCompleted ? "border-chart-1 bg-chart-1/5" : ""}`}
                data-testid={`card-step-${index + 1}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {isCompleted
                        ? <CheckCircle className="w-5 h-5 text-chart-1" />
                        : <Circle className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg" data-testid={`text-step-${index + 1}-title`}>
                          {step.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {index + 1} / {steps.length}
                        </Badge>
                      </div>
                      {step.description && (
                        <p className="text-muted-foreground" data-testid={`text-step-${index + 1}-desc`}>
                          {step.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`step-${index}`}
                          checked={isCompleted}
                          disabled={isLocked}
                          onCheckedChange={(checked) => handleStepComplete(index, checked as boolean)}
                          data-testid={`checkbox-step-${index + 1}`}
                        />
                        <label
                          htmlFor={`step-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {t.customerForm.markComplete}
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Requirements & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.customerForm.requirementsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-medium mb-2">{t.customerForm.systemReqTitle}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t.customerForm.systemReq1}</li>
                <li>• {t.customerForm.systemReq2}</li>
                <li>• {t.customerForm.systemReq3}</li>
                <li>• {t.customerForm.systemReq4}</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.customerForm.securityTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t.customerForm.security1}</li>
                <li>• {t.customerForm.security2}</li>
                <li>• {t.customerForm.security3}</li>
                <li>• {t.customerForm.security4}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
