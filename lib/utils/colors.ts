/**
 * Color Utilities
 * Helper functions for priority and tag color mapping
 */

export function priorityColor(priority: number): string {
  if (priority >= 80) return "#f43f5e";
  if (priority >= 50) return "#f59e0b";
  return "#22c55e";
}

export function priorityBg(priority: number): string {
  if (priority >= 80) return "rgba(244,63,94,0.1)";
  if (priority >= 50) return "rgba(245,158,11,0.1)";
  return "rgba(34,197,94,0.1)";
}

export function tagColor(tag: string): string {
  const colorMap: Record<string, string> = {
    ticketing: "#f43f5e",
    content: "#ec4899",
    influencers: "#db2777",
    creative: "#a78bfa",
    partnership: "#f59e0b",
    budget: "#3b82f6",
    ads: "#14b8a6",
    vip: "#ec4899",
    "email-marketing": "#8b5cf6",
    analytics: "#22c55e",
  };
  return colorMap[tag] || "#ec4899";
}
