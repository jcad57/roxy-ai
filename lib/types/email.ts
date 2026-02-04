import type { LayoutProps } from "@/lib/types/layout";

/**
 * Email Types
 * Core data structures for the email client
 */

export type EmailCategory = "urgent" | "work" | "automated" | "personal";
export type EmailCluster =
  | "operations"
  | "content"
  | "partnerships"
  | "analytics"
  | "finance"
  | "other";
export type EmailSentiment = "positive" | "negative" | "neutral";
export type FolderType = "inbox" | "starred" | "sent" | "drafts" | "trash";
export interface Folder {
  id: FolderType;
  label: string;
  icon: string;
  count: number;
}

export interface Email {
  id: number;
  from: string;
  avatar: string;
  subject: string;
  preview: string;
  time: string;
  priority: number;
  category: EmailCategory;
  tags: string[];
  cluster: EmailCluster;
  read: boolean;
  sentiment: EmailSentiment;
  thread: number;
}

export interface CategoryTab {
  id: string;
  label: string;
  color: string;
  tags: string[]; // Context tag IDs that belong to this category
}

export interface InboxLayoutProps extends LayoutProps {
  emails: Email[];
  isAnalyzing?: boolean;
  unprocessedCount?: number;
}
export interface AISuggestion {
  text: string;
  type: "reply" | "calendar" | "action";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  source?: Email; // Optional, can be linked at runtime
  sourceEmailId?: string; // Reference to email ID
  type: "deadline" | "meeting" | "review";
  color: string;
}

export interface KanbanTodo {
  id: string;
  title: string;
  from?: Email; // Optional, can be linked at runtime
  fromEmailId?: string; // Reference to email ID
  status: string;
  priority: number;
  tag: string;
}
