import { StatusDisplay } from "@/components/StatusDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Settings, HelpCircle } from "lucide-react";
import { useStatus } from "@/hooks/use-status";

export default function Home() {
  const { status } = useStatus();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MonitorSpeaker className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" data-testid="text-site-title">
                  IT Support Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time status and support workflow
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                <span className="w-2 h-2 bg-chart-1 rounded-full mr-2"></span>
                System Online
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status Display */}
          <div className="lg:col-span-1 space-y-6">
            <StatusDisplay
              currentStatus={status?.status || "available"}
              lastUpdated={status ? new Date(status.lastUpdated) : new Date()}
              technicianName={status?.technicianName || "IT Support Team"}
            />

            {/* Quick Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact our IT support team for assistance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Time:</span>
                    <Badge variant="secondary">~3 min</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Session Length:</span>
                    <Badge variant="secondary">15-30 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Support Card */}
            <Card className="border-dashed border-2">
              <CardContent className="pt-6 text-center space-y-3">
                <MonitorSpeaker className="w-8 h-8 text-primary mx-auto" />
                <div>
                  <h3 className="font-medium mb-1">Need Support?</h3>
                  <CardDescription className="mb-3">
                    Start a guided support session
                  </CardDescription>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => window.location.href = "/customer"}
                  data-testid="button-start-support"
                >
                  Start Support Session
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/admin"}
                  data-testid="button-admin-access"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Access
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Support Information</CardTitle>
                <CardDescription>
                  Important information about our IT support services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Before Starting a Support Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">1</Badge>
                          <div>
                            <h4 className="font-medium">Prepare Your Information</h4>
                            <p className="text-sm text-muted-foreground">
                              Have your computer model, operating system version, and error details ready.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">2</Badge>
                          <div>
                            <h4 className="font-medium">Close Sensitive Applications</h4>
                            <p className="text-sm text-muted-foreground">
                              Close any applications containing personal or confidential information.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">3</Badge>
                          <div>
                            <h4 className="font-medium">Ensure Stable Connection</h4>
                            <p className="text-sm text-muted-foreground">
                              Make sure you have a stable internet connection for the duration of the session.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Microsoft Quick Assist Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">System Requirements</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Windows 10 or Windows 11</li>
                            <li>• Internet connection</li>
                            <li>• Microsoft Account (recommended)</li>
                            <li>• Latest Windows updates</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Security Features</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• End-to-end encryption</li>
                            <li>• Session recording available</li>
                            <li>• Granular permission controls</li>
                            <li>• Automatic session timeout</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}