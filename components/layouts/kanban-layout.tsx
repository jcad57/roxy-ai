"use client";

/**
 * Kanban Layout
 * AI-generated task board with draggable cards and customizable columns
 */

import { useState, useEffect } from "react";
import type { KanbanTodo, Email } from "@/lib/types/email";
import type { KanbanColumn } from "@/lib/types/layout";
import { useTheme } from "@/lib/providers/theme-provider";
import { colorPalette } from "@/lib/constants/theme";
import { defaultKanbanColumns } from "@/lib/constants/layouts";
import { priorityColor, tagColor } from "@/lib/utils/colors";
import { getCategoryColor, getContrastTextColor, getLighterColor } from "@/lib/utils/category-colors";
import { mockKanbanTodos } from "@/lib/data/mock-kanban";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";

export function KanbanLayout({ emails }: { emails: Email[] }) {
  const [todos, setTodos] = useState<KanbanTodo[]>(mockKanbanTodos);
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultKanbanColumns);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ colId: string; index: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, themeName } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();
  
  // Track custom sort order for each todo (index in todos array = sort order)
  const [todoOrder, setTodoOrder] = useState<string[]>(() => 
    mockKanbanTodos
      .sort((a, b) => b.priority - a.priority) // Initial sort by priority
      .map((t) => t.id)
  );

  // Settings panel state
  const [editCols, setEditCols] = useState<KanbanColumn[]>(columns);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(colorPalette[0]);

  // Draft todo state
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftPriority, setDraftPriority] = useState(5);
  
  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Dialog state for kanban item details
  const [selectedTodo, setSelectedTodo] = useState<KanbanTodo | null>(null);
  const [todoNotes, setTodoNotes] = useState<Record<string, string>>({});
  const [showSourceEmail, setShowSourceEmail] = useState(false);

  // Sync editCols when settings panel opens
  useEffect(() => {
    if (showSettings) setEditCols(columns);
  }, [showSettings, columns]);

  const move = (id: string, toCol: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: toCol } : t)));
    
    // When using quick-move buttons, add to end of target column
    setTodoOrder((prev) => {
      const withoutMoved = prev.filter((todoId) => todoId !== id);
      // Find the last todo in the target column
      const colTodoIds = withoutMoved.filter((todoId) => {
        const todo = todos.find((t) => t.id === todoId);
        return todo?.status === toCol;
      });
      
      // Insert at end of column
      return withoutMoved.map((todoId) => {
        // Find position of last item in target column
        if (colTodoIds.length > 0 && todoId === colTodoIds[colTodoIds.length - 1]) {
          return todoId;
        }
        return todoId;
      }).concat(id);
    });
  };

  const reorder = (id: string, toCol: string, toIndex: number) => {
    // Update the todo's column if needed
    setTodos((prev) => {
      const todo = prev.find((t) => t.id === id);
      if (!todo) return prev;
      
      if (todo.status !== toCol) {
        return prev.map((t) => (t.id === id ? { ...t, status: toCol } : t));
      }
      return prev;
    });

    // Update the order array
    setTodoOrder((prev) => {
      const draggedId = id;
      const withoutDragged = prev.filter((todoId) => todoId !== draggedId);
      
      // Get todos in the target column (in order)
      const colTodoIds = withoutDragged.filter((todoId) => {
        const todo = todos.find((t) => t.id === todoId);
        return todo?.status === toCol || todoId === draggedId;
      });
      
      // If moving to a different column, we need to consider the todo as being in the new column
      const actualColTodoIds = toCol !== todos.find(t => t.id === draggedId)?.status
        ? withoutDragged.filter((todoId) => {
            const todo = todos.find((t) => t.id === todoId);
            return todo?.status === toCol;
          })
        : colTodoIds;
      
      // Insert at the specified index
      const newColOrder = [
        ...actualColTodoIds.slice(0, toIndex),
        draggedId,
        ...actualColTodoIds.slice(toIndex),
      ];
      
      // Get todos from other columns
      const otherTodoIds = withoutDragged.filter((todoId) => {
        const todo = todos.find((t) => t.id === todoId);
        return todo?.status !== toCol;
      });
      
      return [...otherTodoIds, ...newColOrder];
    });
  };

  // Column management functions
  const updateCol = (idx: number, patch: Partial<KanbanColumn>) => {
    setEditCols((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const moveCol = (idx: number, dir: number) => {
    const next = idx + dir;
    if (next < 0 || next >= editCols.length) return;
    setEditCols((prev) => {
      const a = [...prev];
      [a[idx], a[next]] = [a[next], a[idx]];
      return a;
    });
  };

  const deleteCol = (idx: number) => {
    const col = editCols[idx];
    if (todos.some((t) => t.status === col.id)) return; // blocked
    if (editCols.length <= 1) return;
    setEditCols((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCol = () => {
    if (!newLabel.trim()) return;
    const id = newLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + Date.now().toString(36);
    setEditCols((prev) => [...prev, { id, label: newLabel.trim(), icon: "○", color: newColor, desc: "" }]);
    setNewLabel("");
    setNewColor(colorPalette[editCols.length % colorPalette.length]);
  };

  const applySettings = () => {
    setColumns(editCols);
    setShowSettings(false);
  };

  const saveDraftTodo = () => {
    if (!draftTitle.trim()) return;
    
    const newTodo: KanbanTodo = {
      id: `custom-${Date.now()}`,
      title: draftTitle,
      tag: "CUSTOM",
      priority: draftPriority,
      status: "backlog",
      from: {
        id: Date.now(),
        from: "You",
        avatar: "",
        subject: draftDescription || "Custom task",
        preview: draftDescription || "",
        time: new Date().toISOString(),
        priority: draftPriority,
        category: "work" as const,
        tags: ["custom"],
        cluster: "operations" as const,
        read: true,
        sentiment: "neutral" as const,
        thread: 0,
      },
    };
    
    setTodos((prev) => [...prev, newTodo]);
    setTodoOrder((prev) => [...prev, newTodo.id]);
    
    // Reset form
    setDraftTitle("");
    setDraftDescription("");
    setDraftPriority(5);
    setShowDraftForm(false);
  };

  const cancelDraftTodo = () => {
    setDraftTitle("");
    setDraftDescription("");
    setDraftPriority(5);
    setShowDraftForm(false);
  };
  
  const handleDeleteTodo = (todoId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
    setTodoOrder((prev) => prev.filter((id) => id !== todoId));
    setSelectedTodo(null);
  };
  
  const handleUpdateTodoColor = (todoId: string, newTag: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, tag: newTag } : t))
    );
  };
  
  const handleUpdateTodoPriority = (todoId: string, newPriority: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, priority: newPriority } : t))
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* AI Banner */}
      <div
        style={{
          background: theme.gradBanner,
          borderRadius: "12px 12px 0 0",
          padding: responsivePadding(breakpoint),
          borderTop: `1px solid ${theme.accentDimBorder}`,
          borderLeft: `1px solid ${theme.accentDimBorder}`,
          borderRight: `1px solid ${theme.accentDimBorder}`,
          borderBottom: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 8 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: isMobile ? 9 : 9.5,
                color: theme.accentLight,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 600,
              }}
            >
              ◎ AI-Generated Task Board
            </span>
            <span
              style={{
                fontSize: isMobile ? 8.5 : 9,
                background: theme.accentDimBorder,
                color: theme.accentLight,
                padding: "2px 7px",
                borderRadius: 10,
              }}
            >
              {todos.length} tasks · {columns.length} columns
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: isMobile ? 9.5 : 10.5, color: theme.textDim }}>
              {isMobile ? "Swipe to view all" : "Drag cards to move"}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "rgba(15,23,42,0.5)",
                border: `1px solid ${theme.borderMuted}`,
                color: theme.textDim,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          borderLeft: `1px solid ${theme.borderMuted}`,
          borderRight: `1px solid ${theme.borderMuted}`,
          borderBottom: `1px solid ${theme.borderMuted}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
          width: "100%",
        }}
      >
        {columns.map((col, ci) => {
          // Get todos for this column, sorted by custom order
          const colTodos = todoOrder
            .map((id) => todos.find((t) => t.id === id))
            .filter((t): t is KanbanTodo => t !== undefined && t.status === col.id);
          const hasMoreThanFive = columns.length > 5;
          return (
            <div
              key={col.id}
              style={{
                minWidth: isMobile ? 280 : 200,
                maxWidth: isMobile ? 280 : hasMoreThanFive ? "20%" : "none",
                flex: isMobile ? "0 0 280px" : hasMoreThanFive ? "0 0 20%" : "1 1 0",
                borderRight: `1px solid ${theme.borderMuted}`,
                display: "flex",
                flexDirection: "column",
                background: `${col.color}04`,
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: isMobile ? "8px 10px" : "10px 12px",
                  borderBottom: `1px solid ${theme.borderMuted}`,
                  flexShrink: 0,
                  background: "rgba(15,23,42,0.5)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: col.color }}>{col.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      background: `${col.color}20`,
                      color: col.color,
                      padding: "1px 7px",
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {colTodos.length}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: theme.textDim }}>{col.desc || "—"}</div>
              </div>

              {/* Cards */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  position: "relative",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // If dragging over empty space, set drop target to end
                  if (dragId && e.target === e.currentTarget) {
                    setDropTarget({ colId: col.id, index: colTodos.length });
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = e.dataTransfer.getData("id");
                  if (id && dropTarget && dropTarget.colId === col.id) {
                    reorder(id, col.id, dropTarget.index);
                  }
                  setDropTarget(null);
                }}
                onDragLeave={(e) => {
                  // Only clear if leaving the entire column
                  if (e.currentTarget === e.target) {
                    setDropTarget(null);
                  }
                }}
              >
                {colTodos.map((todo, ti) => {
                  const categoryColor = getCategoryColor(todo.tag, themeName);
                  const textColor = getContrastTextColor(categoryColor);
                  const hoverColor = getLighterColor(categoryColor, 0.1);
                  const isDragging = dragId === todo.id;
                  const isHovered = hoveredCard === todo.id && !isDragging;
                  const showDropLine = dropTarget?.colId === col.id && dropTarget?.index === ti;
                  
                  return (
                  <div key={todo.id} style={{ position: "relative" }}>
                    {/* Drop Indicator Line */}
                    {showDropLine && (
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
                      onClick={(e) => {
                        // Only open dialog if not dragging
                        if (!isDragging) {
                          setSelectedTodo(todo);
                        }
                      }}
                      style={{
                        padding: "10px 11px",
                        borderRadius: 9,
                        cursor: isDragging ? "grabbing" : "pointer",
                        transition: "all 0.15s",
                        background: isDragging ? `${categoryColor}99` : isHovered ? hoverColor : categoryColor,
                        border: `1px solid ${isDragging ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.1)"}`,
                        opacity: isDragging ? 0.7 : 1,
                        animation: `fadeSlideIn 0.3s ease ${ti * 50}ms both`,
                        boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.25)" : "0 2px 4px rgba(0,0,0,0.1)",
                        transform: isDragging ? "scale(1.02)" : "scale(1)",
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("id", todo.id);
                        setDragId(todo.id);
                        setHoveredCard(null); // Clear hover state when dragging starts
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropTarget(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (dragId && dragId !== todo.id) {
                          setDropTarget({ colId: col.id, index: ti });
                        }
                      }}
                      onMouseEnter={() => {
                        if (!isDragging) {
                          setHoveredCard(todo.id);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredCard(null);
                      }}
                    >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          background: textColor === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
                          color: textColor,
                          padding: "2px 7px",
                          borderRadius: 5,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {todo.tag}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: textColor,
                            opacity: 0.7,
                          }}
                        />
                        <span style={{ fontSize: 9, color: textColor, opacity: 0.8 }}>{todo.priority}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: textColor, lineHeight: 1.45, fontWeight: 500 }}>
                      {todo.title}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span style={{ fontSize: 9, color: textColor, opacity: 0.7 }}>from</span>
                      <span
                        style={{
                          fontSize: 9,
                          color: textColor,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {todo.from?.from || "Custom Task"}
                      </span>
                    </div>
                  </div>
                  </div>
                  );
                })}
                {/* Drop zone at the end of the column */}
                {colTodos.length > 0 && dropTarget?.colId === col.id && dropTarget?.index === colTodos.length && (
                  <div
                    style={{
                      height: 3,
                      background: theme.accentLight,
                      borderRadius: 2,
                      marginTop: -3,
                      boxShadow: `0 0 8px ${theme.accentLight}`,
                      animation: "fadeIn 0.15s ease",
                    }}
                  />
                )}
                {/* Empty column drop zone */}
                {colTodos.length === 0 && !showDraftForm && (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 100,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `2px dashed ${theme.borderMuted}`,
                      borderRadius: 8,
                      color: theme.textDim,
                      fontSize: 11,
                      textAlign: "center",
                      padding: 20,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragId) {
                        setDropTarget({ colId: col.id, index: 0 });
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const id = e.dataTransfer.getData("id");
                      if (id) {
                        reorder(id, col.id, 0);
                      }
                      setDropTarget(null);
                    }}
                  >
                    {dragId ? "Drop here" : "No tasks yet"}
                  </div>
                )}
                
                {/* Draft Form - Only in Backlog Column */}
                {col.id === "backlog" && showDraftForm && (
                  <div
                    style={{
                      padding: "10px 11px",
                      borderRadius: 9,
                      background: theme.bgCard,
                      border: `2px solid ${theme.accentDimBorder}`,
                      animation: "fadeSlideIn 0.3s ease both",
                      marginTop: colTodos.length > 0 ? 5 : 0,
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 9, color: theme.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Task title..."
                        autoFocus
                        style={{
                          width: "100%",
                          background: theme.bg,
                          border: `1px solid ${theme.borderMuted}`,
                          borderRadius: 6,
                          color: theme.textPrimary,
                          fontSize: 11.5,
                          padding: "6px 8px",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.metaKey) saveDraftTodo();
                          if (e.key === "Escape") cancelDraftTodo();
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 9, color: theme.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                        Description
                      </label>
                      <textarea
                        value={draftDescription}
                        onChange={(e) => setDraftDescription(e.target.value)}
                        placeholder="Task description..."
                        style={{
                          width: "100%",
                          background: theme.bg,
                          border: `1px solid ${theme.borderMuted}`,
                          borderRadius: 6,
                          color: theme.textPrimary,
                          fontSize: 10.5,
                          padding: "6px 8px",
                          outline: "none",
                          fontFamily: "inherit",
                          minHeight: 60,
                          resize: "vertical",
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 9, color: theme.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                        Priority
                      </label>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                          <button
                            key={p}
                            onClick={() => setDraftPriority(p)}
                            style={{
                              flex: 1,
                              background: draftPriority === p ? theme.accentDimBorder : theme.bg,
                              color: draftPriority === p ? theme.accentLight : theme.textMuted,
                              border: `1px solid ${draftPriority === p ? theme.accentDimBorder : theme.borderMuted}`,
                              borderRadius: 4,
                              padding: "4px 2px",
                              fontSize: 9,
                              fontWeight: draftPriority === p ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={saveDraftTodo}
                        disabled={!draftTitle.trim()}
                        style={{
                          flex: 1,
                          background: draftTitle.trim() ? theme.accentDimBorder : theme.bg,
                          color: draftTitle.trim() ? theme.accentLight : theme.textDim,
                          border: `1px solid ${draftTitle.trim() ? theme.accentDimBorder : theme.borderMuted}`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: draftTitle.trim() ? "pointer" : "not-allowed",
                          transition: "all 0.15s",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelDraftTodo}
                        style={{
                          flex: 1,
                          background: "transparent",
                          color: theme.textMuted,
                          border: `1px solid ${theme.borderMuted}`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Add Task Button - Only in Backlog Column */}
                {col.id === "backlog" && !showDraftForm && (
                  <button
                    onClick={() => setShowDraftForm(true)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: `2px dashed ${theme.borderMuted}`,
                      borderRadius: 8,
                      color: theme.textMuted,
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      marginTop: colTodos.length > 0 ? 5 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.bgCard;
                      e.currentTarget.style.borderColor = theme.accentDimBorder;
                      e.currentTarget.style.color = theme.accentLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = theme.borderMuted;
                      e.currentTarget.style.color = theme.textMuted;
                    }}
                  >
                    <span style={{ fontSize: 14 }}>+</span>
                    <span>Add Custom Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Ghost "Add Column" Section */}
        <div
          style={{
            minWidth: isMobile ? 280 : 200,
            maxWidth: isMobile ? 280 : columns.length > 5 ? "20%" : "none",
            flex: isMobile ? "0 0 280px" : columns.length > 5 ? "0 0 20%" : "1 1 0",
            display: "flex",
            flexDirection: "column",
            border: `2px dashed ${theme.borderMuted}`,
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
            opacity: 0.5,
          }}
          onClick={() => setShowSettings(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
            e.currentTarget.style.borderColor = theme.accentDimBorder;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
            e.currentTarget.style.borderColor = theme.borderMuted;
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 10,
              padding: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `2px dashed ${theme.borderMuted}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: theme.textDim,
              }}
            >
              +
            </div>
            <div
              style={{
                fontSize: 12,
                color: theme.textMuted,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              Add Column
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 50,
              animation: "fadeIn 0.2s ease both",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: isMobile ? "100%" : isTablet ? 320 : 380,
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
            {/* Header */}
            <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${theme.borderMuted}`, flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>Customize Columns</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
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
              <div style={{ fontSize: 11, color: theme.textDim, lineHeight: 1.5 }}>
                Rename, recolor, reorder, or add columns. Changes apply when you hit Save.
              </div>
            </div>

            {/* Column List */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {editCols.map((col, idx) => {
                const blocked = todos.some((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    style={{
                      background: "rgba(15,23,42,0.5)",
                      border: `1px solid ${theme.borderMuted}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                      animation: `fadeSlideIn 0.3s ease ${idx * 40}ms both`,
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 10px 8px" }}>
                      {/* Color Swatch */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: col.color,
                          border: "2px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {col.icon}
                      </div>
                      {/* Label Input */}
                      <input
                        value={col.label}
                        onChange={(e) => updateCol(idx, { label: e.target.value })}
                        style={{
                          flex: 1,
                          background: "rgba(15,23,42,0.6)",
                          border: `1px solid ${theme.borderMuted}`,
                          borderRadius: 6,
                          color: theme.textPrimary,
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "5px 8px",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                      {/* Move Up/Down */}
                      <button
                        onClick={() => moveCol(idx, -1)}
                        disabled={idx === 0}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 5,
                          background: "rgba(15,23,42,0.5)",
                          border: `1px solid ${theme.borderMuted}`,
                          color: idx === 0 ? "#2d3748" : theme.textMuted,
                          fontSize: 11,
                          cursor: idx === 0 ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveCol(idx, 1)}
                        disabled={idx === editCols.length - 1}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 5,
                          background: "rgba(15,23,42,0.5)",
                          border: `1px solid ${theme.borderMuted}`,
                          color: idx === editCols.length - 1 ? "#2d3748" : theme.textMuted,
                          fontSize: 11,
                          cursor: idx === editCols.length - 1 ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ▼
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => deleteCol(idx)}
                        disabled={blocked || editCols.length <= 1}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 5,
                          background: blocked ? "rgba(15,23,42,0.3)" : "rgba(244,63,94,0.12)",
                          border: `1px solid ${blocked ? theme.borderMuted : "rgba(244,63,94,0.25)"}`,
                          color: blocked ? "#2d3748" : "#f43f5e",
                          fontSize: 12,
                          cursor: blocked || editCols.length <= 1 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Color Palette */}
                    <div style={{ display: "flex", gap: 5, padding: "0 10px 8px", flexWrap: "wrap" }}>
                      {colorPalette.map((c) => (
                        <div
                          key={c}
                          onClick={() => updateCol(idx, { color: c })}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            background: c,
                            cursor: "pointer",
                            border: col.color === c ? "2px solid #fff" : "2px solid transparent",
                            boxShadow: col.color === c ? `0 0 6px ${c}60` : "none",
                            transition: "all 0.15s",
                          }}
                        />
                      ))}
                    </div>

                    {/* Description Input */}
                    <div style={{ padding: "0 10px 10px" }}>
                      <input
                        value={col.desc}
                        onChange={(e) => updateCol(idx, { desc: e.target.value })}
                        placeholder="Column description…"
                        style={{
                          width: "100%",
                          background: "rgba(15,23,42,0.6)",
                          border: `1px solid ${theme.borderMuted}`,
                          borderRadius: 6,
                          color: theme.textMuted,
                          fontSize: 10.5,
                          padding: "4px 8px",
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>

                    {/* Blocked Warning */}
                    {blocked && (
                      <div
                        style={{
                          margin: "0 10px 8px",
                          padding: "4px 8px",
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.2)",
                          borderRadius: 5,
                        }}
                      >
                        <span style={{ fontSize: 9.5, color: "#f59e0b" }}>
                          ⚠ Has {todos.filter((t) => t.status === col.id).length} card
                          {todos.filter((t) => t.status === col.id).length > 1 ? "s" : ""} — move them before
                          deleting
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add New Column */}
              <div
                style={{
                  background: "rgba(15,23,42,0.3)",
                  border: `1px dashed ${theme.borderMuted}`,
                  borderRadius: 10,
                  padding: "12px 10px",
                  marginTop: 4,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color: theme.textDim,
                    marginBottom: 8,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  + Add Column
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCol()}
                    placeholder="Column name…"
                    style={{
                      flex: 1,
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${theme.borderMuted}`,
                      borderRadius: 6,
                      color: theme.textPrimary,
                      fontSize: 12,
                      padding: "6px 8px",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={addCol}
                    disabled={!newLabel.trim()}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: newLabel.trim() ? theme.accentDimBorder : "rgba(15,23,42,0.4)",
                      border: `1px solid ${newLabel.trim() ? theme.accentDimBorder : theme.borderMuted}`,
                      color: newLabel.trim() ? theme.accentLight : theme.textDim,
                      fontSize: 16,
                      cursor: newLabel.trim() ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    +
                  </button>
                </div>
                {/* Color Picker for New Column */}
                <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                  {colorPalette.map((c) => (
                    <div
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        background: c,
                        cursor: "pointer",
                        border: newColor === c ? "2px solid #fff" : "2px solid transparent",
                        boxShadow: newColor === c ? `0 0 6px ${c}60` : "none",
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 16px 20px", borderTop: `1px solid ${theme.borderMuted}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  onClick={() => {
                    setEditCols(columns);
                    setShowSettings(false);
                  }}
                  style={{
                    background: "transparent",
                    color: theme.textDim,
                    border: `1px solid ${theme.borderMuted}`,
                    borderRadius: 7,
                    padding: "6px 14px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditCols(defaultKanbanColumns)}
                    style={{
                      background: "transparent",
                      color: theme.accentLight,
                      border: `1px solid ${theme.accentDimBorder}`,
                      borderRadius: 7,
                      padding: "6px 12px",
                      fontSize: 10.5,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={applySettings}
                    style={{
                      background: theme.accentDimBorder,
                      color: theme.accentLight,
                      border: "none",
                      borderRadius: 7,
                      padding: "6px 18px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Todo Detail Dialog */}
      {selectedTodo && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedTodo(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              zIndex: 999,
              animation: "fadeIn 0.2s ease",
            }}
          />

          {/* Dialog */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: isMobile ? "90%" : isTablet ? 500 : 600,
              maxHeight: "85vh",
              background: theme.bg,
              borderRadius: 16,
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: `1px solid ${theme.borderMuted}`,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobile ? "20px" : "24px 28px",
                borderBottom: `1px solid ${theme.borderMuted}`,
                flexShrink: 0,
                background: getCategoryColor(selectedTodo.tag, themeName),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: isMobile ? 18 : 20,
                      fontWeight: 700,
                      color: getContrastTextColor(getCategoryColor(selectedTodo.tag, themeName)),
                      lineHeight: 1.3,
                      marginBottom: 10,
                    }}
                  >
                    {selectedTodo.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        background: getContrastTextColor(getCategoryColor(selectedTodo.tag, themeName)) === "#ffffff" 
                          ? "rgba(255,255,255,0.25)" 
                          : "rgba(0,0,0,0.15)",
                        color: getContrastTextColor(getCategoryColor(selectedTodo.tag, themeName)),
                        padding: "3px 8px",
                        borderRadius: 5,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedTodo.tag}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: getContrastTextColor(getCategoryColor(selectedTodo.tag, themeName)),
                        opacity: 0.9,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Priority:</span>
                      <span>{selectedTodo.priority}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTodo(null)}
                  style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 20,
                    color: getContrastTextColor(getCategoryColor(selectedTodo.tag, themeName)),
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)";
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: isMobile ? "20px" : "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {/* Notes Section */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>✎</span> YOUR NOTES
                </div>
                <textarea
                  value={todoNotes[selectedTodo.id] || ""}
                  onChange={(e) => setTodoNotes({ ...todoNotes, [selectedTodo.id]: e.target.value })}
                  placeholder="Add notes, reminders, or action items for this task..."
                  style={{
                    width: "100%",
                    minHeight: 100,
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderMuted}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 13,
                    color: theme.textPrimary,
                    lineHeight: 1.6,
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "all 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.accentLight;
                    e.currentTarget.style.background = theme.bgCardHover;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = theme.borderMuted;
                    e.currentTarget.style.background = theme.bgCard;
                  }}
                />
              </div>

              {/* Manage Section */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>⚙️</span> MANAGE TASK
                </div>

                {/* Priority Selector */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      marginBottom: 10,
                    }}
                  >
                    Priority Level
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleUpdateTodoPriority(selectedTodo.id, p)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 7,
                          background: selectedTodo.priority === p ? theme.accent : theme.bgCard,
                          border: `1px solid ${selectedTodo.priority === p ? theme.accent : theme.borderMuted}`,
                          color: selectedTodo.priority === p ? theme.textPrimary : theme.textMuted,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTodo.priority !== p) {
                            e.currentTarget.style.borderColor = theme.accent;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTodo.priority !== p) {
                            e.currentTarget.style.borderColor = theme.borderMuted;
                          }
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category/Color Selector */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      marginBottom: 10,
                    }}
                  >
                    Category
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["urgent", "work", "social", "finance", "personal", "review", "custom"].map((category) => {
                      const categoryColor = getCategoryColor(category, themeName);
                      const isSelected = selectedTodo.tag === category;
                      return (
                        <button
                          key={category}
                          onClick={() => handleUpdateTodoColor(selectedTodo.id, category)}
                          style={{
                            padding: "8px 14px",
                            background: isSelected ? categoryColor : theme.bgCard,
                            border: `2px solid ${isSelected ? categoryColor : theme.borderMuted}`,
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            color: isSelected ? getContrastTextColor(categoryColor) : theme.textMuted,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = categoryColor;
                              e.currentTarget.style.color = categoryColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = theme.borderMuted;
                              e.currentTarget.style.color = theme.textMuted;
                            }
                          }}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      handleDeleteTodo(selectedTodo.id);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    background: "transparent",
                    border: `1px solid #f43f5e`,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#f43f5e",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f43f5e";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#f43f5e";
                  }}
                >
                  🗑️ Delete Task
                </button>
              </div>

              {/* Source Email Section */}
              <div>
                <button
                  onClick={() => setShowSourceEmail(!showSourceEmail)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    marginBottom: showSourceEmail ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📧</span> SOURCE EMAIL
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      color: theme.textMuted,
                      transition: "transform 0.2s",
                      transform: showSourceEmail ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {showSourceEmail && selectedTodo.from && (
                  <div
                    style={{
                      background: theme.bgCard,
                      borderRadius: 10,
                      padding: "14px 16px",
                      border: `1px solid ${theme.borderMuted}`,
                      animation: "fadeSlideIn 0.2s ease both",
                    }}
                  >
                    <div style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>
                      {selectedTodo.from.subject}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5, marginTop: 8 }}>
                      {selectedTodo.from.preview}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textDim, marginTop: 8 }}>
                      From {selectedTodo.from.from} · {selectedTodo.from.time}
                    </div>
                    <button
                      style={{
                        marginTop: 12,
                        background: "transparent",
                        color: theme.accentLight,
                        border: `1px solid ${theme.accentDimBorder}`,
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.accentDimBorder;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      View Full Email →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: isMobile ? "16px 20px 20px" : "20px 28px 24px",
                borderTop: `1px solid ${theme.borderMuted}`,
                flexShrink: 0,
                background: theme.bg,
              }}
            >
              <button
                onClick={() => setSelectedTodo(null)}
                style={{
                  width: "100%",
                  background: theme.accent,
                  color: theme.textPrimary,
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
