/**
 * Mock Context Tags
 * AI-generated tags from email analysis
 * These represent topics, themes, and contexts extracted from emails
 */

export interface ContextTag {
  id: string;
  label: string;
  category: "action" | "topic" | "priority" | "project" | "person" | "event";
}

export const mockContextTags: ContextTag[] = [
  // Action-related
  { id: "action-needed", label: "Action Needed", category: "action" },
  { id: "deadline", label: "Deadline", category: "action" },
  { id: "review", label: "Review", category: "action" },
  { id: "approval", label: "Approval", category: "action" },
  { id: "feedback", label: "Feedback", category: "action" },
  { id: "decision", label: "Decision", category: "action" },
  
  // Priority-related
  { id: "urgent", label: "Urgent", category: "priority" },
  { id: "high-priority", label: "High Priority", category: "priority" },
  { id: "low-priority", label: "Low Priority", category: "priority" },
  { id: "follow-up", label: "Follow Up", category: "priority" },
  
  // Topic-related
  { id: "ticketing", label: "Ticketing", category: "topic" },
  { id: "social", label: "Social Media", category: "topic" },
  { id: "creative", label: "Creative", category: "topic" },
  { id: "analytics", label: "Analytics", category: "topic" },
  { id: "streaming", label: "Streaming", category: "topic" },
  { id: "partnerships", label: "Partnerships", category: "topic" },
  { id: "sponsorship", label: "Sponsorship", category: "topic" },
  { id: "marketing", label: "Marketing", category: "topic" },
  { id: "finance", label: "Finance", category: "topic" },
  { id: "legal", label: "Legal", category: "topic" },
  { id: "logistics", label: "Logistics", category: "topic" },
  { id: "merchandise", label: "Merchandise", category: "topic" },
  { id: "production", label: "Production", category: "topic" },
  { id: "talent", label: "Talent", category: "topic" },
  
  // Project-related
  { id: "coachella", label: "Coachella", category: "project" },
  { id: "bonnaroo", label: "Bonnaroo", category: "project" },
  { id: "website", label: "Website", category: "project" },
  { id: "app", label: "App", category: "project" },
  { id: "campaign", label: "Campaign", category: "project" },
  
  // Event-related
  { id: "meeting", label: "Meeting", category: "event" },
  { id: "call", label: "Call", category: "event" },
  { id: "presentation", label: "Presentation", category: "event" },
  { id: "launch", label: "Launch", category: "event" },
  
  // People-related
  { id: "vendor", label: "Vendor", category: "person" },
  { id: "client", label: "Client", category: "person" },
  { id: "team", label: "Team", category: "person" },
  { id: "executive", label: "Executive", category: "person" },
];

// Helper function to get tags by category
export function getTagsByCategory(category: ContextTag["category"]): ContextTag[] {
  return mockContextTags.filter(tag => tag.category === category);
}

// Helper function to get tag by id
export function getTagById(id: string): ContextTag | undefined {
  return mockContextTags.find(tag => tag.id === id);
}
