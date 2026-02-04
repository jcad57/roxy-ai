"use client";

/**
 * Main Email Client Page
 * Orchestrates all layout views and UI components
 */

import { useState, useEffect } from "react";
import type { LayoutId } from "@/lib/types/layout";
import { layouts } from "@/lib/constants/layouts";
import { useEmailData } from "@/lib/hooks/use-email-data";
import { useViewPreferences } from "@/lib/hooks/use-view-preferences";
import {
  enrichedArrayToLegacy,
  sortByAIPriority,
} from "@/lib/adapters/email-adapter";

// Load dev helpers for console access
import "@/lib/services/storage/dev-helpers";

// Layout Components
import { InboxLayout } from "@/components/layouts/inbox-layout";
import { PriorityLayout } from "@/components/layouts/priority-layout";
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
import { ErrorBanner } from "@/components/ui/error-banner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { toggleView } from "@/lib/utils/main-layout-helpers";
import { AppLayoutWrapper } from "@/components/ui/app-layout-wrapper";
import MainContentWrapper from "@/components/ui/main-content-wrapper";

function EmailClient() {
  const allIds = layouts.map((l) => l.id);

  // Supabase view preferences
  const {
    viewPreferences,
    enabledViews: supabaseEnabledViews,
    updateView,
    updateViewOrder,
    isLoading: isLoadingViews,
  } = useViewPreferences();

  // Local state with fallback to all views if Supabase not loaded yet
  const [enabledViews, setEnabledViews] = useState<LayoutId[]>(allIds);
  const [layoutOrder, setLayoutOrder] = useState<LayoutId[]>(allIds);
  const [activeLayout, setActiveLayout] = useState<LayoutId>("inbox");
  const [showPicker, setShowPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  // Sync Supabase view preferences to local state
  useEffect(() => {
    if (viewPreferences.length > 0) {
      const ordered = viewPreferences
        .sort((a, b) => a.display_order - b.display_order)
        .map((v) => v.view_id as LayoutId);

      const enabled = viewPreferences
        .filter((v) => v.enabled)
        .map((v) => v.view_id as LayoutId);

      setLayoutOrder(ordered);
      setEnabledViews(enabled);
    }
  }, [viewPreferences]);

  // Email data with AI enrichment from IndexedDB
  const {
    processedEmails,
    unprocessedEmails,
    isLoading: isLoadingEmails,
    isAnalyzing,
    progress,
    analyzedCount,
    totalToAnalyze,
    analysisError,
    clearError,
    analyzeAll,
  } = useEmailData();

  // Convert processed emails to legacy format for display
  // Only show emails that have been analyzed (have enrichment data)
  const emails = sortByAIPriority(enrichedArrayToLegacy(processedEmails));

  // Debug logging
  useEffect(() => {
    console.log("📧 Email Data Status:");
    console.log(`  Processed: ${processedEmails.length}`);
    console.log(`  Unprocessed: ${unprocessedEmails.length}`);
    console.log(`  Displaying: ${emails.length}`);
    console.log(`  Is Analyzing: ${isAnalyzing}`);
    if (processedEmails.length > 0) {
      console.log("  Sample processed:", processedEmails[0]);
    }
    if (unprocessedEmails.length > 0) {
      console.log("  Sample unprocessed:", unprocessedEmails[0]);
    }
  }, [processedEmails, unprocessedEmails, emails, isAnalyzing]);

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

  // Handlers for view preferences (save to Supabase)
  const handleToggleView = async (id: LayoutId) => {
    const isCurrentlyEnabled = enabledViews.includes(id);
    const newEnabled = isCurrentlyEnabled
      ? enabledViews.filter((v) => v !== id)
      : [...enabledViews, id];

    // Optimistically update local state
    setEnabledViews(newEnabled);

    // Save to Supabase
    try {
      await updateView({
        viewId: id,
        updates: { enabled: !isCurrentlyEnabled },
      });
      console.log("✅ View preference saved to Supabase");
    } catch (error) {
      console.error("❌ Failed to save view preference:", error);
      // Rollback on error
      setEnabledViews(enabledViews);
    }
  };

  const handleReorderViews = async (newOrder: LayoutId[]) => {
    // Optimistically update local state
    setLayoutOrder(newOrder);

    // Save to Supabase
    try {
      const orderedViews = newOrder.map((viewId, index) => ({
        viewId,
        order: index,
      }));
      await updateViewOrder(orderedViews);
      console.log("✅ View order saved to Supabase");
    } catch (error) {
      console.error("❌ Failed to save view order:", error);
      // Rollback on error
      setLayoutOrder(layoutOrder);
    }
  };

  const handleEnableAll = async () => {
    // Optimistically update local state
    setEnabledViews(allIds);

    // Save to Supabase
    try {
      await Promise.all(
        allIds.map((id) =>
          updateView({ viewId: id, updates: { enabled: true } })
        )
      );
      console.log("✅ All views enabled in Supabase");
    } catch (error) {
      console.error("❌ Failed to enable all views:", error);
      // Rollback on error
      setEnabledViews(enabledViews);
    }
  };

  // Sort layouts by custom order
  const orderedLayouts = [...layouts].sort((a, b) => {
    const indexA = layoutOrder.indexOf(a.id);
    const indexB = layoutOrder.indexOf(b.id);
    return indexA - indexB;
  });

  const visibleLayouts = orderedLayouts.filter((l) =>
    enabledViews.includes(l.id)
  );

  const currentLayout = orderedLayouts.find((l) => l.id === activeLayout);

  return (
    <AppLayoutWrapper>
      {/* Top Navigation */}
      <NavBar
        emailCount={emails.length}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Error Banner */}
      {analysisError && (
        <ErrorBanner
          message={analysisError}
          onDismiss={clearError}
          onRetry={() => {
            clearError();
            analyzeAll();
          }}
        />
      )}

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

      <LayoutSwitcher
        layouts={visibleLayouts}
        activeLayout={activeLayout}
        onLayoutChange={setActiveLayout}
        onCustomizeClick={() => setShowPicker(true)}
        showCustomize={showPicker}
        currentLayoutDesc={currentLayout?.desc || ""}
      />

      {/* Main Content Area */}
      <MainContentWrapper>
        {activeLayout === "inbox" ? (
          <InboxLayout
            emails={emails}
            selected={selected}
            onSelect={setSelected}
            isAnalyzing={isAnalyzing}
            unprocessedCount={unprocessedEmails.length}
          />
        ) : activeLayout === "calendar" ? (
          <CalendarLayout emails={emails} />
        ) : activeLayout === "kanban" ? (
          <KanbanLayout emails={emails} />
        ) : activeLayout === "priority" ? (
          <PriorityLayout
            emails={emails}
            selected={selected}
            onSelect={setSelected}
            isAnalyzing={isAnalyzing}
            unprocessedCount={unprocessedEmails.length}
          />
        ) : activeLayout === "spatial" ? (
          <SpatialLayout
            emails={emails}
            selected={selected}
            onSelect={setSelected}
          />
        ) : activeLayout === "conversation" ? (
          <ConversationLayout
            emails={emails}
            selected={selected}
            onSelect={setSelected}
          />
        ) : null}
      </MainContentWrapper>

      {/* Customize Views Panel */}
      {showPicker && (
        <CustomizeViewsPanel
          layouts={orderedLayouts}
          enabledViews={enabledViews}
          onToggleView={handleToggleView}
          onReorderViews={handleReorderViews}
          onEnableAll={handleEnableAll}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </AppLayoutWrapper>
  );
}

// Export protected version
export default function EmailClientPage() {
  return (
    <ProtectedRoute>
      <EmailClient />
    </ProtectedRoute>
  );
}
