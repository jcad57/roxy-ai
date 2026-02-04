import { useTheme } from "@/lib/providers/theme-provider";

export default function FolderCountBadge({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  const { theme } = useTheme();

  return (
    <span
      style={{
        background: isActive ? theme.accent : theme.borderMuted,
        color: isActive ? theme.textPrimary : theme.textDim,
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
