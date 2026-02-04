/**
 * Context Tags Service
 * Extracts and manages AI-generated context tags from emails
 */

import type { Email } from "@/lib/types/email";

export interface ContextTag {
  id: string;
  label: string;
  count: number; // How many emails have this tag
  category: string; // Derived from the tag content
}

/**
 * Extract all unique context tags from emails
 * Tags come from email.tags (AI-generated and displayed in inbox)
 */
export function extractContextTagsFromEmails(emails: Email[]): ContextTag[] {
  // Count occurrences of each tag
  const tagCounts = new Map<string, number>();

  emails.forEach((email) => {
    if (email.tags && Array.isArray(email.tags)) {
      email.tags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag) {
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });

  // Convert to ContextTag array and categorize
  const tags: ContextTag[] = Array.from(tagCounts.entries()).map(
    ([tag, count]) => ({
      id: tag.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: capitalizeTag(tag),
      count,
      category: categorizeTag(tag),
    })
  );

  // Sort by count (most common first)
  tags.sort((a, b) => b.count - a.count);

  return tags;
}

/**
 * Capitalize tag for display
 */
function capitalizeTag(tag: string): string {
  return tag
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Categorize tags based on keywords
 * This helps group similar tags together
 */
function categorizeTag(tag: string): string {
  const lowerTag = tag.toLowerCase();

  // Action keywords
  if (
    lowerTag.includes("action") ||
    lowerTag.includes("deadline") ||
    lowerTag.includes("urgent") ||
    lowerTag.includes("review") ||
    lowerTag.includes("approval") ||
    lowerTag.includes("decision") ||
    lowerTag.includes("follow")
  ) {
    return "action";
  }

  // Priority keywords
  if (
    lowerTag.includes("priority") ||
    lowerTag.includes("important") ||
    lowerTag.includes("critical")
  ) {
    return "priority";
  }

  // Event keywords
  if (
    lowerTag.includes("meeting") ||
    lowerTag.includes("call") ||
    lowerTag.includes("event") ||
    lowerTag.includes("presentation") ||
    lowerTag.includes("launch")
  ) {
    return "event";
  }

  // People keywords
  if (
    lowerTag.includes("team") ||
    lowerTag.includes("client") ||
    lowerTag.includes("vendor") ||
    lowerTag.includes("executive") ||
    lowerTag.includes("partner")
  ) {
    return "person";
  }

  // Project keywords
  if (
    lowerTag.includes("project") ||
    lowerTag.includes("campaign") ||
    lowerTag.includes("initiative")
  ) {
    return "project";
  }

  // Default to topic
  return "topic";
}

/**
 * Group tags by category
 */
export function groupTagsByCategory(
  tags: ContextTag[]
): Record<string, ContextTag[]> {
  const grouped: Record<string, ContextTag[]> = {};

  tags.forEach((tag) => {
    if (!grouped[tag.category]) {
      grouped[tag.category] = [];
    }
    grouped[tag.category].push(tag);
  });

  return grouped;
}

/**
 * Get tags that match email's tags
 */
export function getTagsForEmail(
  emailTags: string[],
  allTags: ContextTag[]
): ContextTag[] {
  const normalizedEmailTags = emailTags.map((t) =>
    t.toLowerCase().trim()
  );

  return allTags.filter((tag) =>
    normalizedEmailTags.some(
      (emailTag) =>
        emailTag === tag.label.toLowerCase() ||
        emailTag.replace(/[^a-z0-9]+/g, "-") === tag.id
    )
  );
}

/**
 * Check if email has any of the specified tag IDs
 */
export function emailHasTags(emailTags: string[], tagIds: string[]): boolean {
  if (!emailTags || emailTags.length === 0) return false;
  if (!tagIds || tagIds.length === 0) return false;

  const normalizedEmailTags = emailTags.map((t) =>
    t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
  );

  return tagIds.some(
    (tagId) =>
      normalizedEmailTags.includes(tagId) ||
      normalizedEmailTags.includes(tagId.toLowerCase())
  );
}
