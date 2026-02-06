"use client";

/**
 * KPI Cards Component
 * Displays key metrics for the priority layout
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import type { Email } from "@/lib/types/email";

interface KPICardsProps {
  emails: Email[];
}

export function KPICards({ emails }: KPICardsProps) {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useResponsive();

  const urgent = emails.filter((e) => e.priority >= 70);

  const kpis = [
    {
      label: "High Priority",
      val: urgent.length,
      color: "#f43f5e",
      bg: "rgba(244,63,94,0.1)",
    },
    {
      label: "Unread",
      val: emails.filter((e) => !e.read).length,
      color: theme.accentLight,
      bg: theme.accentDimBorder,
    },
    {
      label: "Total Emails",
      val: emails.length,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
    },
    {
      label: "Read",
      val: emails.filter((e) => e.read).length,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
    },
  ];

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr 1fr"
          : isTablet
          ? "repeat(2, 1fr)"
          : "repeat(4, 1fr)",
        gap: isMobile ? 8 : 10,
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          style={{
            background: kpi.bg,
            borderRadius: isMobile ? 10 : 12,
            padding: isMobile ? "8px 10px" : "10px 14px",
            border: `1px solid ${kpi.color}20`,
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 800,
              color: kpi.color,
            }}
          >
            {kpi.val}
          </div>
          <div
            style={{
              fontSize: isMobile ? 9 : 10.5,
              color: theme.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  );
}
