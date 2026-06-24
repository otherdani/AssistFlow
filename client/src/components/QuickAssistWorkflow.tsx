import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Lock, Copy, ArrowRight, MonitorSpeaker } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  hasInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
}

const defaultSteps: WorkflowStep[] = [
  {
    id: "connect",
    title: "Verify Connection",
    description: "Ensure that the customer is completing",
    required: true,
  },
  {
    id: "generate-code",
    title: "Generate Security Code",
    description: "Open Microsoft Quick Assist and click 'Get help' to generate a 6-digit security code",
    required: true,
    hasInput: true,
    inputPlaceholder: "Enter 6-digit security code",
  },
  {
    id: "share-code",
    title: "Share Security Code",
    description: "Provide the security code to the person helping you",
    required: true,
  },
  {
    id: "wait-connection",
    title: "Wait for Connection",
    description: "Wait for the helper to connect using the security code",
    required: true,
  },
  {
    id: "grant-permission",
    title: "Accept the granted permissions",
    description: "Accept the screen sharing and full control request when prompted",
    required: true,
  },
  {
    id: "confirm-identity",
    title: "Confirm Identity and Problem",
    description: "Get information and solve the problem",
    required: true,
  },
];

export function QuickAssistWorkflow() {
  const [steps, setSteps] = useState<WorkflowStep[]>(defaultSteps);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const handleStepComplete = (stepId: string, completed: boolean) => {
    const newCompleted = new Set(completedSteps);
    
    if (completed) {
      newCompleted.add(stepId);
      console.log(`Step completed: ${stepId}`);
    } else {
      newCompleted.delete(stepId);
      console.log(`Step uncompleted: ${stepId}`);
    }
    
    setCompletedSteps(newCompleted);
  };

  const handleInputChange = (stepId: string, value: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, inputValue: value }
        : step
    ));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Security code copied successfully",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const canProceedToNext = () => {
    const current = steps[currentStep];
    const isCompleted = completedSteps.has(current.id);
    const hasRequiredInput = current.hasInput ? current.inputValue?.trim() : true;
    
    return isCompleted && hasRequiredInput;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
      console.log(`Proceeding to step ${currentStep + 2}`);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSteps(defaultSteps);
    console.log("Workflow reset");
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const isWorkflowComplete = currentStep === steps.length - 1 && canProceedToNext();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MonitorSpeaker className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl" data-testid="text-workflow-title">
                Microsoft Quick Assist Workflow
              </CardTitle>
              <p className="text-muted-foreground">
                Follow these steps to establish a secure remote support connection
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" data-testid="text-workflow-progress">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              {isWorkflowComplete && (
                <Badge className="bg-chart-1 text-white">
                  Workflow Complete
                </Badge>
              )}
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStep;
          const isLocked = index > currentStep;
          
          return (
            <Card 
              key={step.id}
              className={`transition-all ${
                isCurrent 
                  ? "border-primary shadow-sm" 
                  : isCompleted 
                    ? "border-chart-1" 
                    : isLocked 
                      ? "opacity-50" 
                      : ""
              }`}
              data-testid={`card-step-${step.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-chart-1" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg" data-testid={`text-step-title-${step.id}`}>
                        {step.title}
                      </h3>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground" data-testid={`text-step-description-${step.id}`}>
                      {step.description}
                    </p>

                    {/* Input Field */}
                    {step.hasInput && !isLocked && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder={step.inputPlaceholder}
                            value={step.inputValue || ""}
                            onChange={(e) => handleInputChange(step.id, e.target.value)}
                            disabled={isLocked}
                            className="flex-1"
                            data-testid={`input-step-${step.id}`}
                          />
                          {step.inputValue && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(step.inputValue!)}
                              data-testid={`button-copy-${step.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completion Checkbox */}
                    {!isLocked && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={step.id}
                          checked={isCompleted}
                          onCheckedChange={(checked) => 
                            handleStepComplete(step.id, checked as boolean)
                          }
                          data-testid={`checkbox-step-${step.id}`}
                        />
                        <label 
                          htmlFor={step.id} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mark as completed
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handleReset}
              data-testid="button-reset-workflow"
            >
              Reset Workflow
            </Button>
            
            <div className="flex gap-3">
              {!isWorkflowComplete && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="gap-2"
                  data-testid="button-next-step"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              
              {isWorkflowComplete && (
                <Button
                  className="gap-2 bg-chart-1 hover:bg-chart-1/90 text-white"
                  onClick={() => {
                    console.log("Workflow completed successfully");
                    toast({
                      title: "Workflow Complete!",
                      description: "Quick Assist connection should now be established.",
                    });
                  }}
                  data-testid="button-complete-workflow"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Workflow
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}