export default function InboxLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
