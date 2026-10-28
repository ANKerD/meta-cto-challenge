export type Match = { uuid: string; title: string; score: number };

export type SubmissionResult =
  | { kind: "error"; message: string }
  | { kind: "duplicate"; matches: Match[] }
  | { kind: "related"; matches: Match[]; confirmation: string }
  | { kind: "unavailable"; message: string; confirmation: string }
  | { kind: "created"; warning?: string };
