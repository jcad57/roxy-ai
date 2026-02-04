/**
 * Mock Kanban Todos
 * AI-extracted actionable tasks from emails
 * Note: Email references will be linked dynamically at runtime
 */

import type { KanbanTodo } from "@/lib/types/email";

export const mockKanbanTodos: KanbanTodo[] = [
  {
    id: "k1",
    title: "Decide: honor or cap 200 oversold Coachella tickets",
    fromEmailId: "1",
    status: "backlog",
    priority: 96,
    tag: "ticketing",
  },
  {
    id: "k2",
    title: "Sign off Bonnaroo 3-week social content calendar",
    fromEmailId: "2",
    status: "backlog",
    priority: 88,
    tag: "content",
  },
  {
    id: "k3",
    title: "Approve ACL influencer roster & deliverable scope",
    fromEmailId: "9",
    status: "backlog",
    priority: 85,
    tag: "influencers",
  },
  {
    id: "k4",
    title: "Review hero video — call on animated logo lockup",
    fromEmailId: "3",
    status: "inprogress",
    priority: 74,
    tag: "creative",
  },
  {
    id: "k5",
    title: "Respond to Red Bull on exclusivity terms",
    fromEmailId: "5",
    status: "inprogress",
    priority: 91,
    tag: "partnership",
  },
  {
    id: "k6",
    title: "Prep for Sarah sync — identify reallocation options",
    fromEmailId: "10",
    status: "inprogress",
    priority: 79,
    tag: "budget",
  },
  {
    id: "k7",
    title: "Review Google Ads CPC spike & adjust bids",
    fromEmailId: "6",
    status: "inreview",
    priority: 55,
    tag: "ads",
  },
  {
    id: "k8",
    title: "Loop AV team in on VIP acoustic snippet capture",
    fromEmailId: "7",
    status: "inreview",
    priority: 63,
    tag: "vip",
  },
  {
    id: "k9",
    title: "Review Mailchimp A/B results & subject line test",
    fromEmailId: "8",
    status: "completed",
    priority: 18,
    tag: "email-marketing",
  },
  {
    id: "k10",
    title: "Check Spotify dashboard — listener demographics breakdown",
    fromEmailId: "4",
    status: "completed",
    priority: 22,
    tag: "analytics",
  },
];
