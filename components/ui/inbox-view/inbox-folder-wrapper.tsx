import { Folder } from "@/lib/types/email";
import FolderCountBadge from "./folder-count-badge";

export default function InboxFolderWrapper({
  isMobile,
  folder,
  isActive,
}: {
  isMobile: boolean;
  folder: Folder;
  isActive: boolean;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: isMobile ? 14 : 16 }}>{folder.icon}</span>
        {!isMobile && <span>{folder.label}</span>}
      </div>
      {!isMobile && folder.count > 0 && (
        <FolderCountBadge isActive={isActive}>{folder.count}</FolderCountBadge>
      )}
    </>
  );
}
