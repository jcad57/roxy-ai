/**
 * Mock AI Suggestions
 * AI-generated action items
 */

import type { AISuggestion } from "@/lib/types/email";

export const mockAISuggestions: AISuggestion[] = [
  {
    text: "Escalate Ticketmaster capacity flag to Jamie + Legal — decision needed by 3pm",
    type: "reply",
  },
  {
    text: "Block 45 min tomorrow AM to sync with Sarah on Q1 budget reforecast before board deck",
    type: "calendar",
  },
  {
    text: "Red Bull partnership looks high-value — approve Rachel to send exclusivity counter-proposal",
    type: "action",
  },
];
