"use client";

/**
 * Customize Views Panel
 * Slide-out panel for toggling available view modes
 */

import { useState } from "react";
import type { Layout, LayoutId } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";

interface CustomizeViewsPanelProps {
  layouts: Layout[];
  enabledViews: LayoutId[];
  onToggleView: (id: LayoutId) => void;
  onReorderViews: (order: LayoutId[]) => void;
  onEnableAll: () => void;
  onClose: () => void;
}

export function CustomizeViewsPanel({
  layouts,
  enabledViews,
  onToggleView,
  onReorderViews,
  onEnableAll,
  onClose,
}: CustomizeViewsPanelProps) {
  const { theme } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();
  
  const [draggedId, setDraggedId] = useState<LayoutId | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  const handleDragStart = (e: React.DragEvent, layoutId: LayoutId, index: number) => {
    setDraggedId(layoutId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", layoutId);
    
    // Add a slight delay to allow the drag preview to render
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = "0.5";
    }, 0);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDropTargetIndex(null);
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedId && dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the entire item
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedId) return;
    
    const dragIndex = layouts.findIndex(l => l.id === draggedId);
    
    if (dragIndex === dropIndex) {
      setDraggedId(null);
      setDropTargetIndex(null);
      return;
    }
    
    // Create new order array
    const newOrder = [...layouts.map(l => l.id)];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    
    onReorderViews(newOrder);
    setDraggedId(null);
    setDropTargetIndex(null);
  };
  
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 50,
          animation: "fadeIn 0.2s ease both",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: isMobile ? "100%" : isTablet ? 300 : 340,
          background: "#1a1128",
          borderLeft: isMobile ? "none" : `1px solid ${theme.accentDimBorder}`,
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          animation: isMobile
            ? "fadeIn 0.2s ease both"
            : "pickerIn 0.28s cubic-bezier(0.22,1,0.36,1) both",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: responsivePadding(breakpoint),
            borderBottom: `1px solid ${theme.borderMuted}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: theme.accentDimBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: theme.accentLight,
                }}
              >
                ⊞
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>
                Customize Views
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: theme.textDim,
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
                padding: "2px 4px",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: theme.textDim, lineHeight: 1.5 }}>
            Toggle views and drag to reorder them in your nav bar. At least one view must stay active.
          </div>
        </div>

        {/* View List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: responsivePadding(breakpoint),
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 8 : 6,
          }}
        >
          {layouts.map((layout, i) => {
            const on = enabledViews.includes(layout.id);
            const isLast = enabledViews.length === 1 && on;
            const isDragging = draggedId === layout.id;
            const showDropIndicator = dropTargetIndex === i && !isDragging;
            
            return (
              <div key={layout.id} style={{ position: "relative" }}>
                {/* Drop Indicator */}
                {showDropIndicator && (
                  <div
                    style={{
                      position: "absolute",
                      top: -3,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: theme.accentLight,
                      borderRadius: 2,
                      zIndex: 10,
                      boxShadow: `0 0 8px ${theme.accentLight}`,
                      animation: "fadeIn 0.15s ease",
                    }}
                  />
                )}
                
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, layout.id, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, i)}
                  onClick={() => !isLast && onToggleView(layout.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 14px",
                    borderRadius: 10,
                    background: isDragging 
                      ? "rgba(236,72,153,0.15)" 
                      : on 
                        ? "rgba(236,72,153,0.07)" 
                        : "rgba(15,23,42,0.5)",
                    border: isDragging
                      ? `2px dashed ${theme.accentLight}`
                      : on 
                        ? `1px solid ${theme.accentDimBorder}` 
                        : `1px solid ${theme.borderMuted}`,
                    cursor: isLast ? "not-allowed" : isDragging ? "grabbing" : "grab",
                    transition: "all 0.18s",
                    opacity: isLast ? 0.5 : 1,
                    animation: `fadeSlideIn 0.3s ease ${i * 45}ms both`,
                    transform: isDragging ? "scale(1.02)" : "scale(1)",
                  }}
                >
                {/* Drag Handle + Icon */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      cursor: "grab",
                      opacity: 0.5,
                    }}
                  >
                    <div style={{ 
                      width: 3, 
                      height: 3, 
                      borderRadius: "50%", 
                      background: theme.textDim 
                    }} />
                    <div style={{ 
                      width: 3, 
                      height: 3, 
                      borderRadius: "50%", 
                      background: theme.textDim 
                    }} />
                    <div style={{ 
                      width: 3, 
                      height: 3, 
                      borderRadius: "50%", 
                      background: theme.textDim 
                    }} />
                  </div>
                  
                  {/* Icon Circle */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: on ? theme.accentDimBorder : "rgba(15,23,42,0.6)",
                      border: on ? `1px solid ${theme.accentDimBorder}` : `1px solid ${theme.borderMuted}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      color: on ? theme.accentLight : theme.textDim,
                      transition: "all 0.18s",
                    }}
                  >
                    {layout.icon}
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: on ? theme.textPrimary : theme.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    {layout.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: theme.textDim,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {layout.desc}
                  </div>
                </div>

                {/* Toggle Pill */}
                <div
                  style={{
                    width: 42,
                    height: 23,
                    borderRadius: 12,
                    flexShrink: 0,
                    position: "relative",
                    background: on ? theme.accent : "rgba(51,65,85,0.4)",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: on ? 21 : 2,
                      width: 19,
                      height: 19,
                      borderRadius: "50%",
                      background: on ? "#fff" : theme.textDim,
                      transition: "left 0.2s",
                      boxShadow: on ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
                    }}
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Panel Footer */}
        <div
          style={{
            padding: responsivePadding(breakpoint),
            borderTop: `1px solid ${theme.borderMuted}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 10.5, color: theme.textDim }}>
              {enabledViews.length} of {layouts.length} views active
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onEnableAll}
                style={{
                  background: "transparent",
                  color: theme.accentLight,
                  border: `1px solid ${theme.accentDimBorder}`,
                  borderRadius: 7,
                  padding: "5px 12px",
                  fontSize: 10.5,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Enable All
              </button>
              <button
                onClick={onClose}
                style={{
                  background: theme.accentDimBorder,
                  color: theme.accentLight,
                  border: "none",
                  borderRadius: 7,
                  padding: "5px 14px",
                  fontSize: 10.5,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
