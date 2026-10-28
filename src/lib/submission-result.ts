export type Match = { uuid: string; title: string; score: number };

export type SubmissionResult =
  | { kind: "error"; message: string }
  | { kind: "duplicate_review"; matches: Match[]; confirmation: string }
  | { kind: "rejected"; matches: Match[]; confirmation: string; reason: string }
  | { kind: "related"; matches: Match[]; confirmation: string }
  | { kind: "unavailable"; message: string; confirmation: string }
  | { kind: "created"; warning?: string };
