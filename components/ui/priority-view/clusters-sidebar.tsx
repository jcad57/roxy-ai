"use client";

/**
 * Clusters Sidebar Component
 * Displays email clusters and priority filters
 */

import { useTheme } from "@/lib/providers/theme-provider";
import { usePriorityStore } from "@/lib/stores/priority-store";
import type { Email, EmailCluster } from "@/lib/types/email";
import type { PriorityFilter } from "@/lib/stores/priority-store";

interface ClustersSidebarProps {
  emails: Email[];
  clusters: EmailCluster[];
}

export function ClustersSidebar({ emails, clusters }: ClustersSidebarProps) {
  const { theme } = useTheme();
  const activeCluster = usePriorityStore((state) => state.activeCluster);
  const activePriority = usePriorityStore((state) => state.activePriority);
  const toggleCluster = usePriorityStore((state) => state.toggleCluster);
  const setActivePriority = usePriorityStore((state) => state.setActivePriority);

  const priorityOptions = [
    {
      id: "all",
      label: "All",
      color: theme.textMuted,
      count: emails.length,
    },
    {
      id: "high",
      label: "High",
      color: "#f43f5e",
      count: emails.filter((e) => e.priority >= 80).length,
    },
    {
      id: "medium",
      label: "Medium",
      color: "#f59e0b",
      count: emails.filter((e) => e.priority >= 50 && e.priority < 80).length,
    },
    {
      id: "low",
      label: "Low",
      color: "#22c55e",
      count: emails.filter((e) => e.priority < 50).length,
    },
  ];

  return (
    <>
      {/* Clusters */}
      <div
        style={{
          fontSize: 9.5,
          color: theme.textDim,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          fontWeight: 600,
          padding: "0 10px",
          marginBottom: 4,
        }}
      >
        Clusters
      </div>
      {clusters.map((c) => {
        const count = emails.filter((e) => e.cluster === c).length;
        const active = activeCluster === c;
        return (
          <div
            key={c}
            onClick={() => toggleCluster(c)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.15s",
              background: active ? theme.accentDimBorder : "transparent",
              border: active
                ? `1px solid ${theme.accentDimBorder}`
                : "1px solid transparent",
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                color: active ? theme.accentLight : theme.textMuted,
                fontWeight: active ? 600 : 400,
                textTransform: "capitalize",
              }}
            >
              {c}
            </span>
            <span
              style={{
                fontSize: 10,
                background: theme.accentDimBorder,
                color: theme.accentLight,
                padding: "1px 7px",
                borderRadius: 10,
              }}
            >
              {count}
            </span>
          </div>
        );
      })}

      {/* Priority Filter */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 9.5,
            color: theme.textDim,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
            padding: "0 10px",
            marginBottom: 6,
          }}
        >
          Priority Level
        </div>
        {priorityOptions.map((priority) => {
          const active = activePriority === priority.id;
          return (
            <div
              key={priority.id}
              onClick={() => setActivePriority(priority.id as PriorityFilter)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s",
                background: active ? `${priority.color}15` : "transparent",
                border: active
                  ? `1px solid ${priority.color}40`
                  : "1px solid transparent",
                marginBottom: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: priority.color,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: active ? priority.color : theme.textMuted,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {priority.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  background: `${priority.color}20`,
                  color: priority.color,
                  padding: "1px 7px",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                {priority.count}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
