"use client";

/**
 * Empty Selection State Component
 * Displayed when no email is selected
 */

import { useTheme } from "@/lib/providers/theme-provider";

export function EmptySelectionState() {
  const { theme } = useTheme();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.textMuted,
        fontSize: 14,
      }}
    >
      Select an email to read and respond
    </div>
  );
}
