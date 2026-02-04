import { useTheme } from "@/lib/providers/theme-provider";

export const AppLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        background: theme.bg,
        color: theme.textPrimary,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};
