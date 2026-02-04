"use client";

/**
 * Main Email Client Page
 * Orchestrates all layout views and UI components
 */

import { useState, useEffect } from "react";
import type { LayoutId } from "@/lib/types/layout";
import { layouts } from "@/lib/constants/layouts";
import { useTheme } from "@/lib/providers/theme-provider";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { enrichedArrayToLegacy, sortByAIPriority } from "@/lib/adapters/email-adapter";

// Load dev helpers for console access
import "@/lib/services/storage/dev-helpers";

// Layout Components
import { InboxLayout } from "@/components/layouts/inbox-layout";
import { CommandLayout } from "@/components/layouts/command-layout";
import { SpatialLayout } from "@/components/layouts/spatial-layout";
import { ConversationLayout } from "@/components/layouts/conversation-layout";
import { CalendarLayout } from "@/components/layouts/calendar-layout";
import { KanbanLayout } from "@/components/layouts/kanban-layout";

// UI Components
import { NavBar } from "@/components/ui/nav-bar";
import { LayoutSwitcher } from "@/components/ui/layout-switcher";
import { CustomizeViewsPanel } from "@/components/ui/customize-views-panel";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { AnalyzingIndicator } from "@/components/ui/analyzing-indicator";

const layoutComponentMap: Record<LayoutId, React.ComponentType<any>> = {
  inbox: InboxLayout,
  command: CommandLayout,
  spatial: SpatialLayout,
  conversation: ConversationLayout,
  calendar: CalendarLayout,
  kanban: KanbanLayout,
};

export default function EmailClientPage() {
  const allIds = layouts.map((l) => l.id);
  const [enabledViews, setEnabledViews] = useState<LayoutId[]>(allIds);
  const [layoutOrder, setLayoutOrder] = useState<LayoutId[]>(allIds);
  const [activeLayout, setActiveLayout] = useState<LayoutId>("inbox");
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const { theme } = useTheme();
  
  // Email data with AI enrichment from IndexedDB
  const { 
    enrichedEmails,
    isLoading: isLoadingEmails,
    isAnalyzing, 
    progress, 
    analyzedCount, 
    totalToAnalyze,
  } = useEmailData();
  
  // Convert to legacy Email format for existing UI components
  const emails = sortByAIPriority(enrichedArrayToLegacy(enrichedEmails));
  
  // Debug logging
  useEffect(() => {
    console.log("📧 Email Data Status:");
    console.log(`  Enriched Emails: ${enrichedEmails.length}`);
    console.log(`  Converted Emails: ${emails.length}`);
    console.log(`  Is Analyzing: ${isAnalyzing}`);
    if (enrichedEmails.length > 0) {
      console.log("  Sample enriched:", enrichedEmails[0]);
    }
    if (emails.length > 0) {
      console.log("  Sample converted:", emails[0]);
    }
  }, [enrichedEmails, emails, isAnalyzing]);

  // If user disables the currently active view, jump to the first enabled one
  useEffect(() => {
    if (!enabledViews.includes(activeLayout)) {
      setActiveLayout(enabledViews[0]);
    }
  }, [enabledViews, activeLayout]);

  // Clear selection when changing layouts
  useEffect(() => {
    setSelected(null);
  }, [activeLayout]);

  // Sort layouts by custom order
  const orderedLayouts = [...layouts].sort((a, b) => {
    const indexA = layoutOrder.indexOf(a.id);
    const indexB = layoutOrder.indexOf(b.id);
    return indexA - indexB;
  });
  
  const visibleLayouts = orderedLayouts.filter((l) => enabledViews.includes(l.id));
  const LayoutComponent = layoutComponentMap[activeLayout];
  const currentLayout = orderedLayouts.find((l) => l.id === activeLayout);

  const toggleView = (id: LayoutId) => {
    setEnabledViews((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // always keep at least one
        return prev.filter((v) => v !== id);
      }
      // Re-insert in original order
      return allIds.filter((v) => prev.includes(v) || v === id);
    });
  };

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
      {/* Top Navigation */}
      <NavBar emailCount={emails.length} onSettingsClick={() => setShowSettings(true)} />
      
      {/* AI Analysis Indicator */}
      {isAnalyzing && (
        <AnalyzingIndicator
          progress={{
            current: analyzedCount,
            total: totalToAnalyze,
            percentage: progress,
          }}
        />
      )}

      <div
        style={{
          padding: "14px 24px",
          flexShrink: 0,
        }}
      >
        <LayoutSwitcher
          layouts={visibleLayouts}
          activeLayout={activeLayout}
          onLayoutChange={setActiveLayout}
          onCustomizeClick={() => setShowPicker(true)}
          showCustomize={showPicker}
          currentLayoutDesc={currentLayout?.desc || ""}
        />
      </div>

      {/* Main Content Area */}
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
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {activeLayout === "inbox" ? (
            <InboxLayout emails={emails} selected={selected} onSelect={setSelected} />
          ) : activeLayout === "calendar" ? (
            <CalendarLayout emails={emails} />
          ) : activeLayout === "kanban" ? (
            <KanbanLayout emails={emails} />
          ) : activeLayout === "command" ? (
            <CommandLayout emails={emails} selected={selected} onSelect={setSelected} />
          ) : activeLayout === "spatial" ? (
            <SpatialLayout emails={emails} selected={selected} onSelect={setSelected} />
          ) : activeLayout === "conversation" ? (
            <ConversationLayout emails={emails} selected={selected} onSelect={setSelected} />
          ) : null}
        </div>
      </div>

      {/* Customize Views Panel */}
      {showPicker && (
        <CustomizeViewsPanel
          layouts={orderedLayouts}
          enabledViews={enabledViews}
          onToggleView={toggleView}
          onReorderViews={setLayoutOrder}
          onEnableAll={() => setEnabledViews(allIds)}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
