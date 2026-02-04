/**
 * Error Banner Component
 * Displays errors in an elegant, dismissible banner
 */

import { useTheme } from "@/lib/providers/theme-provider";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${theme.error}15 0%, ${theme.error}08 100%)`,
        border: `1px solid ${theme.error}40`,
        borderRadius: "8px",
        padding: "16px",
        margin: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slideDown 0.3s ease-out",
      }}
    >
      {/* Error icon */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: theme.error,
          color: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        !
      </div>

      {/* Error message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: theme.textPrimary,
            marginBottom: "4px",
          }}
        >
          Analysis Error
        </div>
        <div
          style={{
            fontSize: "12px",
            color: theme.textSecondary,
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: theme.textPrimary,
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.cardBg;
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: theme.textSecondary,
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.textPrimary;
              e.currentTarget.style.background = theme.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme.textSecondary;
              e.currentTarget.style.background = "transparent";
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// Add CSS animation to global styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.querySelector('style[data-animation="slideDown"]')) {
    style.setAttribute("data-animation", "slideDown");
    document.head.appendChild(style);
  }
}
