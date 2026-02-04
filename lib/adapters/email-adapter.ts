/**
 * Email Adapter
 * Converts between new architecture (RawEmail + Enrichment) and old Email type
 * This allows us to use new data structure with existing UI components
 */

import type { Email, EmailCategory, EmailCluster, EmailSentiment } from "@/lib/types/email";
import type { EnrichedEmail } from "@/lib/types/email-raw";

/**
 * Convert EnrichedEmail (new) to Email (old format for UI)
 */
export function enrichedToLegacyEmail(enriched: EnrichedEmail): Email {
  // Extract initials for avatar
  const nameParts = enriched.from.name.split(" ");
  const avatar =
    nameParts.length > 1
      ? nameParts[0][0] + nameParts[1][0]
      : nameParts[0].substring(0, 2);

  // Format time
  const date = new Date(enriched.receivedDateTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let timeStr: string;
  if (diffDays === 0) {
    timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (diffDays === 1) {
    timeStr = "Yesterday";
  } else if (diffDays < 7) {
    timeStr = date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Use AI enrichment if available, otherwise defaults
  const priority = enriched.enrichment?.aiPriority ?? 50;
  const sentiment: EmailSentiment = enriched.enrichment?.aiSentiment ?? "neutral";
  const cluster: EmailCluster = enriched.enrichment?.aiCluster ?? "operations";
  const category: EmailCategory = enriched.enrichment?.aiCategory ?? "work";

  // Convert string ID to number for legacy compatibility
  const numericId = parseInt(enriched.id.substring(enriched.id.length - 8), 36) % 10000;

  return {
    id: numericId,
    from: enriched.from.name,
    avatar: avatar.toUpperCase(),
    subject: enriched.subject,
    preview: enriched.bodyPreview,
    time: timeStr,
    priority,
    category,
    tags: enriched.categories || [],
    cluster,
    read: enriched.isRead,
    sentiment,
    thread: 1, // Default thread
  };
}

/**
 * Convert array of EnrichedEmails to legacy Email array
 */
export function enrichedArrayToLegacy(enrichedEmails: EnrichedEmail[]): Email[] {
  return enrichedEmails.map(enrichedToLegacyEmail);
}

/**
 * Sort emails by AI priority (if available)
 */
export function sortByAIPriority(emails: Email[]): Email[] {
  return [...emails].sort((a, b) => b.priority - a.priority);
}
