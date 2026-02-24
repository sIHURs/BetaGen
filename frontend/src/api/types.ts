export type AnalyzeRequest = {
  climb_name: string;
  wall_angle: number;
  attempts: number;
};

export type AnalyzeResponse = {
  climb_name: string;
  grade_estimate: string;
  confidence: number;
  notes: string[];
};
