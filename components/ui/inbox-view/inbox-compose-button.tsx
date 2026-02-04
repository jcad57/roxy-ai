import { useResponsive } from "@/lib/hooks/use-responsive";
import { useTheme } from "@/lib/providers/theme-provider";

export default function InboxComposeButton() {
  const { breakpoint, isMobile } = useResponsive();
  const { theme } = useTheme();
  return (
    <button
      style={{
        width: "100%",
        padding: isMobile ? "10px 0" : "12px 16px",
        background: theme.accent,
        color: theme.textPrimary,
        border: "none",
        borderRadius: 10,
        fontSize: isMobile ? 11 : 13,
        fontWeight: 700,
        cursor: "pointer",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isMobile ? "✏️" : "✏️ Compose"}
    </button>
  );
}
