import { ColorPalette } from "@/lib/types/theme";

export default function LeftSidebarWrapper({
  children,
  isMobile,
  theme,
}: {
  children: React.ReactNode;
  isMobile: boolean;
  theme: ColorPalette;
}) {
  return (
    <div
      style={{
        width: isMobile ? 70 : 240,
        background: theme.bgCard,
        borderRadius: 14,
        padding: isMobile ? "12px 8px" : "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        border: `1px solid ${theme.borderMuted}`,
      }}
    >
      {children}
    </div>
  );
}
