export type DetectionType = "otp" | "link";

export interface Detection {
  id: string;
  type: DetectionType;
  value: string;
  sender: string;
  subject: string;
  detectedAt: number; // timestamp
}

export interface ExtensionStorage {
  detections: Detection[];
  isAuthenticated: boolean;
  accessToken: string | null;
}