/**
 * Layout Configurations
 * Defines available view modes and their properties
 */

import type { Layout, KanbanColumn } from "@/lib/types/layout";
import { theme } from "./theme";

export const layouts: Layout[] = [
  {
    id: "inbox",
    label: "Inbox",
    icon: "📧",
    desc: "Traditional email client with smart features. Browse all emails in a familiar Gmail-style interface with custom categories.",
  },
  {
    id: "priority",
    label: "Priority",
    icon: "◎",
    desc: "AI-prioritized email list. Work through your inbox efficiently by priority, responding to the most important messages first.",
  },
  {
    id: "spatial",
    label: "Spatial",
    icon: "◇",
    desc: "Emails as floating cards on a 2D canvas, spatially grouped by AI-detected clusters. Explore relationships visually.",
  },
  {
    id: "conversation",
    label: "Threads",
    icon: "◡",
    desc: "AI groups related emails into conversations across senders. Context flows like a chat — summaries always visible.",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "⏱",
    desc: "AI extracts deadlines, meetings, and key dates from emails and plots them on a timeline. Your week, assembled automatically.",
  },
  {
    id: "kanban",
    label: "Kanban",
    icon: "⊞",
    desc: "AI converts actionable emails into to-dos and sorts them into urgency lanes. A living task board, built from your inbox.",
  },
];

export const defaultKanbanColumns: KanbanColumn[] = [
  {
    id: "backlog",
    label: "Backlog",
    icon: "○",
    color: "#64748b",
    desc: "Not yet started",
  },
  {
    id: "inprogress",
    label: "In Progress",
    icon: "◐",
    color: theme.accent,
    desc: "Currently working on",
  },
  {
    id: "inreview",
    label: "In Review",
    icon: "◎",
    color: "#f59e0b",
    desc: "Awaiting review or feedback",
  },
  {
    id: "completed",
    label: "Completed",
    icon: "✓",
    color: "#22c55e",
    desc: "Done",
  },
];
