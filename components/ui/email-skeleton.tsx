/**
 * Email Skeleton Loader
 * Shows loading state for emails being analyzed
 */

import { useTheme } from "@/lib/providers/theme-provider";

interface EmailSkeletonProps {
  count?: number;
  variant?: "inbox" | "priority";
}

export function EmailSkeleton({
  count = 1,
  variant = "inbox",
}: EmailSkeletonProps) {
  const { theme } = useTheme();

  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === "priority") {
    return (
      <>
        {skeletons.map((i) => (
          <div
            key={`skeleton-${i}`}
            style={{
              padding: "16px",
              borderBottom: `1px solid ${theme.borderMuted}`,
              display: "flex",
              gap: "16px",
              alignItems: "center",
              opacity: 0.6,
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          >
            {/* Priority indicator skeleton */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: theme.bgCard,
                flexShrink: 0,
              }}
            />

            {/* Email content skeleton */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* From line */}
              <div
                style={{
                  height: "14px",
                  width: "40%",
                  background: theme.bgCard,
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />

              {/* Subject line */}
              <div
                style={{
                  height: "16px",
                  width: "80%",
                  background: theme.bgCard,
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />

              {/* Preview line */}
              <div
                style={{
                  height: "12px",
                  width: "60%",
                  background: theme.bgCard,
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Status badge skeleton */}
            <div
              style={{
                width: "80px",
                height: "24px",
                borderRadius: "12px",
                background: theme.bgCard,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </>
    );
  }

  // Inbox variant
  return (
    <>
      {skeletons.map((i) => (
        <div
          key={`skeleton-${i}`}
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${theme.borderMuted}`,
            opacity: 0.6,
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                height: "14px",
                width: "30%",
                background: theme.bgCard,
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                height: "14px",
                width: "15%",
                background: theme.bgCard,
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Subject line */}
          <div
            style={{
              height: "16px",
              width: "70%",
              background: theme.bgCard,
              borderRadius: "4px",
              marginBottom: "8px",
            }}
          />

          {/* Preview line */}
          <div
            style={{
              height: "12px",
              width: "90%",
              background: theme.bgCard,
              borderRadius: "4px",
            }}
          />
        </div>
      ))}
    </>
  );
}

// Add CSS animation to global styles if not already present
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 0.3;
      }
    }
  `;
  if (!document.querySelector('style[data-animation="pulse"]')) {
    style.setAttribute("data-animation", "pulse");
    document.head.appendChild(style);
  }
}
