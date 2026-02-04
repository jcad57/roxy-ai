/**
 * Layout Types
 * Types for the different view modes
 */

export type LayoutId =
  | "inbox"
  | "priority"
  | "spatial"
  | "conversation"
  | "calendar"
  | "kanban";

export interface Layout {
  id: LayoutId;
  label: string;
  icon: string;
  desc: string;
}

export interface LayoutProps {
  selected: any;
  onSelect: (item: any) => void;
  isAnalyzing?: boolean;
  unprocessedCount?: number;
}

export interface KanbanColumn {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
}
