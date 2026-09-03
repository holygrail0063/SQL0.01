export type TourId = "queryright_app_tour_v1" | "queryright_workspace_tour_v1";
export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";
export type TourShape = "rect" | "circle";
export type TourCardPlacement = "target" | "center";

export type TourStep = {
  id: string;
  target: string;
  title: string;
  description: string;
  placement?: TourPlacement;
  route?: string;
  shape?: TourShape;
  spotlightPadding?: number;
  cardPlacement?: TourCardPlacement;
};

export const APP_TOUR_ID: TourId = "queryright_app_tour_v1";
export const WORKSPACE_TOUR_ID: TourId = "queryright_workspace_tour_v1";

export const appTourSteps: TourStep[] = [
  {
    id: "learn",
    target: '[data-tour="nav-learn"]',
    title: "Your courses",
    description: "Start a learning path or continue exactly where you left off. Beginner and Interview Prep live here.",
    placement: "bottom",
    shape: "rect",
  },
  {
    id: "sql-space",
    target: '[data-tour="nav-sql-space"]',
    title: "Your SQL workspace",
    description: "Jump back into your current SQL work and continue practicing.",
    placement: "bottom",
    shape: "rect",
  },
  {
    id: "profile",
    target: '[data-tour="profile-menu"]',
    title: "Make it yours",
    description: "Manage your profile, appearance and learning preferences here.",
    placement: "left",
    shape: "circle",
    spotlightPadding: 8,
  },
  {
    id: "tour-replay",
    target: '[data-tour="app-tour-replay"]',
    title: "Need this again?",
    description: "Replay this tour anytime from here.",
    placement: "top",
    route: "/account/help",
    shape: "rect",
  },
];

export const workspaceTourSteps: TourStep[] = [
  {
    id: "question",
    target: '[data-tour="workspace-question"]',
    title: "Your task",
    description: "Start here. Read what the question is asking you to return before writing SQL.",
    placement: "bottom",
    cardPlacement: "center",
  },
  {
    id: "schema",
    target: '[data-tour="schema-explorer"]',
    title: "Meet SQLBank",
    description: "Explore the available tables and columns here before writing your query.",
    placement: "right",
    cardPlacement: "center",
  },
  {
    id: "editor",
    target: '[data-tour="sql-editor"]',
    title: "Write your SQL",
    description: "Build your query here. You can edit and retry as many times as you need.",
    placement: "left",
    cardPlacement: "center",
  },
  {
    id: "run",
    target: '[data-tour="run-query"]',
    title: "Run your query",
    description: "Execute your SQL and let QueryRight check whether it answers the task correctly.",
    placement: "left",
    cardPlacement: "center",
  },
  {
    id: "results",
    target: '[data-tour="result-tabs"]',
    title: "Understand what happened",
    description: "Results shows the returned data. Feedback helps when something is wrong. Query Breakdown explains what your SQL did.",
    placement: "top",
    cardPlacement: "center",
  },
  {
    id: "hints",
    target: '[data-tour="hint-control"]',
    title: "Need a push?",
    description: "Reveal hints when you're stuck. Try solving the question yourself before opening them.",
    placement: "bottom",
    cardPlacement: "center",
  },
  {
    id: "replay",
    target: '[data-tour="replay-lesson"]',
    title: "Review the concept",
    description: "Forgot the syntax? Replay the lesson animation anytime without losing your query or progress.",
    placement: "bottom",
    cardPlacement: "center",
  },
  {
    id: "navigation",
    target: '[data-tour="next-navigation"]',
    title: "Keep moving",
    description: "When you're done, use this button to continue. QueryRight saves your progress as you learn.",
    placement: "left",
    cardPlacement: "center",
  },
];

export function tourCompletionKey(userId: string, tourId: TourId) {
  return `queryright:tour:${userId}:${tourId}:completed`;
}

export function pendingTourKey(userId: string) {
  return `queryright:tour:${userId}:pending`;
}

export function isTourCompleted(userId: string, tourId: TourId) {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(tourCompletionKey(userId, tourId)) === "true";
}

export function markTourCompleted(userId: string, tourId: TourId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tourCompletionKey(userId, tourId), "true");
}

export function consumePendingTour(userId: string, tourId: TourId) {
  if (typeof window === "undefined") return false;
  const key = pendingTourKey(userId);
  const pending = window.localStorage.getItem(key);
  if (pending !== tourId) return false;
  window.localStorage.removeItem(key);
  return true;
}

export function requestTour(userId: string, tourId: TourId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(pendingTourKey(userId), tourId);
  window.dispatchEvent(new CustomEvent("queryright:start-tour", { detail: { tourId } }));
}