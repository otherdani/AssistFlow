
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StatusType } from "@/components/StatusBadge";

interface TechnicianStatus {
  status: StatusType;
  lastUpdated: string;
  technicianName: string;
}

async function fetchStatus(): Promise<TechnicianStatus> {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error("Failed to fetch status");
  }
  return response.json();
}

async function updateStatus(status: StatusType): Promise<TechnicianStatus> {
  const response = await fetch("/api/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error("Failed to update status");
  }
  return response.json();
}

export function useStatus() {
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  };
}
