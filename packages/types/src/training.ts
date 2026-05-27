export type TrainingStatus = "draft" | "connecting" | "live" | "paused" | "completed";
export type TrainingCategory = "atl" | "maker_space" | "ict_cal";
export type ModuleType = "quiz" | "whiteboard" | "reflection" | "matrix" | "custom" | "attendance";
export type TrainingRole =
  | "lead_trainer"
  | "full_editor"
  | "partial_editor"
  | "facilitation_support";
export type ConnectionStatus = "online" | "offline";

export interface Training {
  id: string;
  workspaceId: string;
  title: string;
  category: TrainingCategory;
  description: string | null;
  scheduledAt: Date | null;
  currentActiveModuleId: string | null;
  sessionStatus: TrainingStatus;
  joinToken: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  facilitators?: Array<{ userId: string; role: TrainingRole }>;
  modules?: TrainingModule[];
  days?: TrainingDay[];
}

export interface TrainingDay {
  id: string;
  trainingId: string;
  dayNumber: number;
  title: string;
  date: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  modules?: TrainingModule[];
}

export interface TrainingModule {
  id: string;
  trainingId: string;
  dayId: string | null;
  title: string;
  moduleType: ModuleType;
  position: number;
  isUnlocked: boolean;
  isAlwaysOn: boolean;
  config: ModuleConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "select";
  options?: string[]; // for select type
  required: boolean;
}

export interface ModuleConfig {
  // Quiz
  questions?: QuizQuestion[];
  // Whiteboard
  canvasWidth?: number;
  canvasHeight?: number;
  // Matrix
  rows?: string[];
  columns?: string[];
  // Reflection
  prompt?: string;
  maxLength?: number;
  // Sticky notes
  backgroundColor?: string;
  // Attendance
  attendanceFields?: AttendanceField[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  options?: string[];
  correctAnswer?: string;
}

export interface TrainingFacilitator {
  trainingId: string;
  userId: string;
  role: TrainingRole;
  assignedModules: string[];
}

export interface TrainingParticipant {
  trainingId: string;
  userId: string;
  joinedAt: Date;
  connectionStatus: ConnectionStatus;
  lastHeartbeat: Date | null;
}

export interface ParticipantResponse {
  id: string;
  trainingId: string;
  moduleId: string;
  userId: string;
  responseData: ResponseData;
  submittedAt: Date;
}

export interface LiveSession {
  id: string;
  trainingId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: "active" | "completed";
  targetResponses: number | null;
  createdBy: string;
  createdAt: Date;
}

export interface SessionStats {
  sessionId: string;
  submitted: number;
  totalParticipants: number;
  completionPct: number;
  targetResponses: number | null;
}

export interface SubmissionEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  hasSubmitted: boolean;
  submittedAt: string | null;
  responseId: string | null;
}

export type ResponseData =
  | { type: "quiz"; answers: Record<string, string> }
  | { type: "whiteboard"; strokes: StrokeData[] }
  | { type: "reflection"; text: string }
  | { type: "matrix"; cells: Record<string, string> }
  | { type: "sticky"; notes: StickyNote[] }
  | { type: "attendance"; fields: Record<string, string> };

export interface StrokeData {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool?: "pen" | "eraser" | "highlighter";
}

export interface StickyNote {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface TrainingAnalytics {
  trainingId: string;
  workspaceId: string;
  aggregateData: Record<string, unknown>;
  exportUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceEntry {
  userId: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface QuizAggregate {
  questionId: string;
  totalResponses: number;
  distribution: Record<string, number>;
}
