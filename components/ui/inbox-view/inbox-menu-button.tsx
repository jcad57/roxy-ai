import { Folder, FolderType } from "@/lib/types/email";
import { useTheme } from "@/lib/providers/theme-provider";

export default function InboxMenuButton({
  folder,
  isActive,
  setActiveFolder,
  isMobile,
  children,
}: {
  folder: Folder;
  isActive: boolean;
  setActiveFolder: (folder: FolderType) => void;
  isMobile: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <button
      key={folder.id}
      onClick={() => setActiveFolder(folder.id)}
      style={{
        width: "100%",
        padding: isMobile ? "10px 8px" : "10px 12px",
        background: isActive ? theme.accentDimBorder : "transparent",
        border: `1px solid ${isActive ? theme.accentDimBorder : "transparent"}`,
        borderRadius: 8,
        fontSize: isMobile ? 10 : 13,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? theme.accentLight : theme.textMuted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: isMobile ? "center" : "space-between",
        gap: 8,
        transition: "all 0.15s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = theme.borderMuted;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}
