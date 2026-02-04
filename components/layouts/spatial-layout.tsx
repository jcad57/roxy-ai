"use client";

/**
 * Spatial Layout
 * Emails as floating cards on a 2D canvas, spatially grouped by clusters
 */

import type { EmailCluster, Email } from "@/lib/types/email";
import type { LayoutProps } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { priorityColor } from "@/lib/utils/colors";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";

const getClusterPositions = (isMobile: boolean, accentColor: string): Record<EmailCluster, { x: number; y: number; color: string }> => {
  if (isMobile) {
    return {
      operations: { x: 60, y: 40, color: "#f43f5e" },
      content: { x: 200, y: 35, color: accentColor },
      partnerships: { x: 130, y: 140, color: "#f59e0b" },
      analytics: { x: 280, y: 120, color: "#14b8a6" },
      finance: { x: 70, y: 220, color: "#3b82f6" },
      other: { x: 260, y: 240, color: "#64748b" },
    };
  }
  return {
    operations: { x: 80, y: 50, color: "#f43f5e" },
    content: { x: 300, y: 40, color: accentColor },
    partnerships: { x: 200, y: 180, color: "#f59e0b" },
    analytics: { x: 420, y: 160, color: "#14b8a6" },
    finance: { x: 100, y: 280, color: "#3b82f6" },
    other: { x: 380, y: 280, color: "#64748b" },
  };
};

export function SpatialLayout({ emails, selected, onSelect }: LayoutProps & { emails: Email[] }) {
  const { theme } = useTheme();
  const { breakpoint, isMobile } = useResponsive();
  const clusterPositions = getClusterPositions(isMobile, theme.accent);
  const cardPositions: Record<number, { x: number; y: number }> = {};
  const clusterCounts: Record<string, number> = {};

  emails.forEach((e) => {
    const base = clusterPositions[e.cluster];
    const idx = clusterCounts[e.cluster] || 0;
    clusterCounts[e.cluster] = idx + 1;
    const total = emails.filter((em) => em.cluster === e.cluster).length;
    const angle = (idx / total) * Math.PI * 2;
    cardPositions[e.id] = {
      x: base.x + Math.cos(angle) * 58,
      y: base.y + Math.sin(angle) * 58,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100%", gap: isMobile ? 12 : 16 }}>
      {/* Canvas */}
      <div
        style={{
          flex: 1,
          minHeight: isMobile ? "50vh" : "auto",
          position: "relative",
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(236,72,153,0.05) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(59,130,246,0.04) 0%, transparent 50%)",
          borderRadius: isMobile ? 12 : 16,
          border: `1px solid ${theme.borderMuted}`,
          overflow: "hidden",
        }}
      >
        {/* Cluster Labels */}
        {Object.entries(clusterPositions).map(([name, pos]) => (
          <div
            key={name}
            style={{
              position: "absolute",
              left: pos.x - 20,
              top: pos.y - 24,
              fontSize: 9.5,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: pos.color,
              fontWeight: 700,
              opacity: 0.7,
              textShadow: `0 0 20px ${pos.color}40`,
            }}
          >
            {name}
          </div>
        ))}

        {/* Connection Lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {emails.map((e) => {
            const base = clusterPositions[e.cluster];
            const card = cardPositions[e.id];
            return (
              <line
                key={e.id}
                x1={base.x}
                y1={base.y}
                x2={card.x}
                y2={card.y}
                stroke={clusterPositions[e.cluster].color}
                strokeWidth={0.5}
                opacity={0.2}
              />
            );
          })}
        </svg>

        {/* Email Cards */}
        {emails.map((email, i) => {
          const pos = cardPositions[email.id];
          const cc = clusterPositions[email.cluster].color;
          return (
            <div
              key={email.id}
              onClick={() => onSelect(email)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: isMobile ? 100 : 110,
                padding: isMobile ? "6px 8px" : "8px 10px",
                borderRadius: isMobile ? 8 : 10,
                cursor: "pointer",
                transition: "all 0.2s",
                background: selected?.id === email.id ? "rgba(30,20,40,0.95)" : "rgba(15,23,42,0.8)",
                border: selected?.id === email.id ? `1px solid ${cc}` : `1px solid ${cc}30`,
                boxShadow: selected?.id === email.id ? `0 0 16px ${cc}30` : "none",
                animation: `fadeIn 0.4s ease ${i * 60}ms both`,
                zIndex: selected?.id === email.id ? 10 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: priorityColor(email.priority),
                  }}
                />
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: theme.textSecondary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {email.from.split(" ")[0]}
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: theme.textDim,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {email.subject.slice(0, 30)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div
        style={{
          width: isMobile ? "100%" : breakpoint === "tablet" ? 240 : 260,
          maxHeight: isMobile ? "45vh" : "none",
          overflowY: "auto",
        }}
      >
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 10 }}>
            {/* Back Button on Mobile */}
            {isMobile && (
              <button
                onClick={() => onSelect(null)}
                style={{
                  background: theme.accentDimBorder,
                  color: theme.accentLight,
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ← Back to Canvas
              </button>
            )}
            <div
              style={{
                background: theme.bgCard,
                borderRadius: isMobile ? 10 : 14,
                padding: responsivePadding(breakpoint),
                border: `1px solid ${theme.borderMuted}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: `${clusterPositions[selected.cluster as EmailCluster].color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: clusterPositions[selected.cluster as EmailCluster].color,
                    fontWeight: 700,
                  }}
                >
                  {selected.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textPrimary }}>{selected.from}</div>
                  <div style={{ fontSize: 10, color: theme.textDim }}>{selected.time}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, marginBottom: 8 }}>
                {selected.subject}
              </div>
              <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>{selected.preview}</div>
            </div>
            <div
              style={{
                background: `${clusterPositions[selected.cluster as EmailCluster].color}10`,
                borderRadius: 10,
                padding: 12,
                border: `1px solid ${clusterPositions[selected.cluster as EmailCluster].color}25`,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: clusterPositions[selected.cluster as EmailCluster].color,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Cluster: {selected.cluster}
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>
                {emails
                  .filter((e) => e.cluster === selected.cluster && e.id !== selected.id)
                  .map((e) => e.from)
                  .join(", ")}
                <span style={{ color: theme.textDim }}> also in this cluster</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  background: theme.accentDimBorder,
                  color: theme.accentLight,
                  border: `1px solid ${theme.accentDimBorder}`,
                  borderRadius: 8,
                  padding: isMobile ? "10px 0" : "8px 0",
                  fontSize: 11.5,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reply
              </button>
              <button
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.15)",
                  color: "#22c55e",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 8,
                  padding: isMobile ? "10px 0" : "8px 0",
                  fontSize: 11.5,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Done ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "#475569",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>◇</div>
            Tap any card on the canvas to explore
          </div>
        )}
      </div>
    </div>
  );
}
