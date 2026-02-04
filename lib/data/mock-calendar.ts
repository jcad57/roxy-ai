/**
 * Mock Calendar Events
 * AI-extracted calendar events from emails
 * Note: Source email references will be linked dynamically at runtime
 */

import type { CalendarEvent } from "@/lib/types/email";

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "ce1",
    title: "Ticketmaster capacity decision deadline",
    date: "2026-02-01",
    time: "3:00 PM",
    sourceEmailId: "1",
    type: "deadline",
    color: "#f43f5e",
  },
  {
    id: "ce2",
    title: "Bonnaroo social calendar sign-off due",
    date: "2026-02-01",
    time: "EOD",
    sourceEmailId: "2",
    type: "deadline",
    color: "#f43f5e",
  },
  {
    id: "ce3",
    title: "Sync with Sarah — Q1 budget reforecast",
    date: "2026-02-02",
    time: "9:00 AM",
    sourceEmailId: "10",
    type: "meeting",
    color: "#ec4899",
  },
  {
    id: "ce4",
    title: "ACL influencer passes ship",
    date: "2026-02-06",
    time: "EOD",
    sourceEmailId: "9",
    type: "deadline",
    color: "#f43f5e",
  },
  {
    id: "ce5",
    title: "Red Bull exclusivity terms due",
    date: "2026-02-06",
    time: "EOD",
    sourceEmailId: "5",
    type: "deadline",
    color: "#f59e0b",
  },
  {
    id: "ce6",
    title: "Splash page hero video review",
    date: "2026-02-03",
    time: "2:00 PM",
    sourceEmailId: "3",
    type: "review",
    color: "#a78bfa",
  },
  {
    id: "ce7",
    title: "Board deck finalization",
    date: "2026-02-04",
    time: "12:00 PM",
    sourceEmailId: "10",
    type: "deadline",
    color: "#f43f5e",
  },
  {
    id: "ce8",
    title: "Review Google Ads bid adjustments",
    date: "2026-02-02",
    time: "11:00 AM",
    sourceEmailId: "6",
    type: "review",
    color: "#a78bfa",
  },
];
