
export interface TechnicianStatus {
  status: "available" | "away" | "assisting" | "offline";
  lastUpdated: Date;
  technicianName: string;
}

class StatusManager {
  private currentStatus: TechnicianStatus = {
    status: "available",
    lastUpdated: new Date(),
    technicianName: "IT Support Team"
  };

  getCurrentStatus(): TechnicianStatus {
    return { ...this.currentStatus };
  }

  updateStatus(status: TechnicianStatus["status"]): TechnicianStatus {
    this.currentStatus = {
      ...this.currentStatus,
      status,
      lastUpdated: new Date()
    };
    return { ...this.currentStatus };
  }

  setTechnicianName(name: string): void {
    this.currentStatus.technicianName = name;
  }
}

export const statusManager = new StatusManager();
