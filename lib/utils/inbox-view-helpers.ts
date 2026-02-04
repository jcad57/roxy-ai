import { Email } from "../types/email";

import { FolderType } from "@/lib/types/email";

export const getFolders = (emails: Email[]) => [
  {
    id: "inbox" as FolderType,
    label: "Inbox",
    icon: "📥",
    count: emails.length,
  },
  { id: "starred" as FolderType, label: "Starred", icon: "⭐", count: 0 },
  { id: "sent" as FolderType, label: "Sent", icon: "📤", count: 0 },
  { id: "drafts" as FolderType, label: "Drafts", icon: "📝", count: 0 },
  { id: "trash" as FolderType, label: "Trash", icon: "🗑️", count: 0 },
];

export const getPriorityColor = (priority: number) => {
  if (priority >= 80) return "#f43f5e";
  if (priority >= 50) return "#f59e0b";
  return "#22c55e";
};
