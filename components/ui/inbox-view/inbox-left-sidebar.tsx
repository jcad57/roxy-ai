import { getFolders } from "@/lib/utils/inbox-view-helpers";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { useTheme } from "@/lib/providers/theme-provider";
import { FolderType } from "@/lib/types/email";
import { Email } from "@/lib/types/email";

import InboxMenuButton from "./inbox-menu-button";
import InboxComposeButton from "./inbox-compose-button";
import LeftSidebarWrapper from "./left-sidebar-wrapper";
import FolderCountBadge from "./folder-count-badge";
import InboxFolderWrapper from "./inbox-folder-wrapper";

export default function InboxLeftSidebar({
  emails,
  activeFolder,
  setActiveFolder,
}: {
  emails: Email[];
  activeFolder: FolderType;
  setActiveFolder: (folder: FolderType) => void;
}) {
  const { breakpoint, isMobile } = useResponsive();
  const { theme } = useTheme();
  return (
    <LeftSidebarWrapper isMobile={isMobile} theme={theme}>
      {/* Compose Button */}
      <InboxComposeButton />

      {/* Folder List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {getFolders(emails).map((folder) => {
          const isActive = activeFolder === folder.id;
          return (
            <InboxMenuButton
              folder={folder}
              isActive={isActive}
              setActiveFolder={setActiveFolder}
              isMobile={isMobile}
              key={folder.id}
            >
              <InboxFolderWrapper
                isMobile={isMobile}
                folder={folder}
                isActive={isActive}
              />
            </InboxMenuButton>
          );
        })}
      </div>
    </LeftSidebarWrapper>
  );
}
