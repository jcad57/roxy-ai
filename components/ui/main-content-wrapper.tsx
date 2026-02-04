export default function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "12px 20px 20px",
        overflow: "hidden",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
