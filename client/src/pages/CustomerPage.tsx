import { CustomerWorkflowForm } from "@/components/CustomerWorkflowForm";
import { useLocation } from "wouter";

export default function CustomerPage() {
  const [location] = useLocation();
  
  // Extract session ID from URL if present (e.g., /customer/session-id)
  const sessionId = location.startsWith("/customer/") ? location.split("/customer/")[1] : undefined;

  return <CustomerWorkflowForm sessionId={sessionId} />;
}