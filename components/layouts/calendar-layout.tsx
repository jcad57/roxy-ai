"use client";

/**
 * Calendar Layout
 * AI-extracted deadlines and events from emails
 */

import { useState, useMemo } from "react";
import type { CalendarEvent, Email } from "@/lib/types/email";
import { useTheme } from "@/lib/providers/theme-provider";
import { mockCalendarEvents } from "@/lib/data/mock-calendar";
import { useResponsive } from "@/lib/hooks/use-responsive";
import { responsivePadding } from "@/lib/utils/responsive-styles";
import { getContrastTextColor, getLighterColor } from "@/lib/utils/category-colors";

type CalendarView = "week" | "2weeks" | "month";

// Generate calendar days dynamically based on view
function generateDays(view: CalendarView, startDate: Date = new Date(2026, 1, 1)) {
  const days = [];
  const dateKeys = [];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // For week and 2weeks views, align to Sunday
  let actualStartDate = new Date(startDate);
  let numDays: number;
  
  if (view === "week") {
    // Find the Sunday of the week containing startDate
    const dayOfWeek = actualStartDate.getDay(); // 0 = Sunday, 6 = Saturday
    actualStartDate.setDate(actualStartDate.getDate() - dayOfWeek);
    numDays = 7;
  } else if (view === "2weeks") {
    // Find the Sunday of the week containing startDate
    const dayOfWeek = actualStartDate.getDay();
    actualStartDate.setDate(actualStartDate.getDate() - dayOfWeek);
    numDays = 14;
  } else {
    // For month view, calculate the actual number of days in the month
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    actualStartDate = new Date(year, month, 1); // Start at first day of month
    numDays = new Date(year, month + 1, 0).getDate();
  }
  
  // Check if today's date is in range
  const today = new Date(2026, 1, 1); // Feb 1, 2026
  
  for (let i = 0; i < numDays; i++) {
    const date = new Date(actualStartDate);
    date.setDate(date.getDate() + i);
    
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    
    // Check if this date is today
    const isToday = date.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    // Always show day name + number for clarity
    let label = `${dayName} ${dayNum}`;
    if (isToday) label = `Today ${dayNum}`;
    else if (isTomorrow) label = `Tomorrow ${dayNum}`;
    
    days.push({
      date: `${dayName} ${monthName} ${dayNum}`,
      label,
      isToday,
      dayNum,
      monthName,
    });
    
    // Format: YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    dateKeys.push(`${year}-${month}-${day}`);
  }
  
  return { days, dateKeys };
}

const typeIcon = (t: string) => {
  if (t === "deadline") return "⚑";
  if (t === "meeting") return "◐";
  return "◎";
};

export function CalendarLayout({ emails }: { emails: Email[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [startDate, setStartDate] = useState<Date>(new Date(2026, 1, 1)); // Feb 1, 2026
  const [eventNotes, setEventNotes] = useState<Record<string, string>>({});
  const [showSourceEmail, setShowSourceEmail] = useState(false);
  const { theme } = useTheme();
  const { breakpoint, isMobile, isTablet } = useResponsive();

  // Adjust start date when switching to month view (align to start of month)
  const handleViewChange = (newView: CalendarView) => {
    setCalendarView(newView);
    if (newView === "month") {
      setStartDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(1); // Set to first day of the month
        return newDate;
      });
    }
  };

  // Generate days based on selected view and start date
  const { days, dateKeys } = useMemo(() => generateDays(calendarView, startDate), [calendarView, startDate]);

  // Navigation functions
  const goToPrevious = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      if (calendarView === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else if (calendarView === "2weeks") {
        newDate.setDate(newDate.getDate() - 14);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
        newDate.setDate(1); // Keep at first day of month
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setStartDate((prev) => {
      const newDate = new Date(prev);
      if (calendarView === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else if (calendarView === "2weeks") {
        newDate.setDate(newDate.getDate() + 14);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
        newDate.setDate(1); // Keep at first day of month
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setStartDate(new Date(2026, 1, 1)); // Reset to Feb 1, 2026
  };

  // Format date range for display
  const getDateRangeLabel = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    if (calendarView === "week") {
      // Align to Sunday for week view
      const weekStart = new Date(startDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 6);
      
      const startMonth = monthNames[weekStart.getMonth()];
      const endMonth = monthNames[endDate.getMonth()];
      const startYear = weekStart.getFullYear();
      
      if (weekStart.getMonth() === endDate.getMonth()) {
        return `${startMonth} ${weekStart.getDate()}-${endDate.getDate()}, ${startYear}`;
      } else {
        return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
      }
    } else if (calendarView === "2weeks") {
      // Align to Sunday for 2 weeks view
      const weekStart = new Date(startDate);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      
      const endDate = new Date(weekStart);
      endDate.setDate(endDate.getDate() + 13);
      
      const startMonth = monthNames[weekStart.getMonth()];
      const endMonth = monthNames[endDate.getMonth()];
      const startYear = weekStart.getFullYear();
      
      if (weekStart.getMonth() === endDate.getMonth()) {
        return `${startMonth} ${weekStart.getDate()}-${endDate.getDate()}, ${startYear}`;
      } else {
        return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
      }
    } else {
      const startMonth = monthNames[startDate.getMonth()];
      const startYear = startDate.getFullYear();
      return `${startMonth} ${startYear}`;
    }
  };

  // Calculate grid columns based on view and screen size
  const gridColumns = useMemo(() => {
    if (isMobile) return 1;
    if (isTablet) {
      return calendarView === "week" ? 3 : calendarView === "2weeks" ? 3 : 7;
    }
    return 7; // Always 7 columns for week layout (Sun-Sat)
  }, [isMobile, isTablet, calendarView]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* AI Extraction Banner */}
      <div
        style={{
          background: theme.gradBanner,
          borderRadius: "12px 12px 0 0",
          padding: responsivePadding(breakpoint),
          border: `1px solid ${theme.accentDimBorder}`,
          borderBottom: "none",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", width: "100%", gap: isMobile ? 12 : 0, justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center" }}>
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
                ◎ AI-Extracted Timeline
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
                {events.length} events from {emails.length} emails
              </span>
              <span
                style={{
                  fontSize: isMobile ? 11 : 13,
                  color: theme.textPrimary,
                  fontWeight: 700,
                  marginLeft: isMobile ? 0 : 8,
                }}
              >
                {getDateRangeLabel()}
              </span>
              {!isMobile && (
                <button
                  onClick={goToToday}
                  style={{
                    background: theme.accentDim,
                    border: `1px solid ${theme.accentDimBorder}`,
                    color: theme.accentLight,
                    fontSize: 9,
                    cursor: "pointer",
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.accentDimBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.accentDim;
                  }}
                >
                  Today
                </button>
              )}
            </div>
            
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {/* View Selector */}
              <div style={{ display: "flex", gap: 4, background: theme.bgCard, borderRadius: 8, padding: 3, border: `1px solid ${theme.borderMuted}` }}>
                {[
                  { id: "week" as CalendarView, label: "Week" },
                  { id: "2weeks" as CalendarView, label: "2 Weeks" },
                  { id: "month" as CalendarView, label: "Month" },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => handleViewChange(view.id)}
                    style={{
                      background: calendarView === view.id ? theme.accentDimBorder : "transparent",
                      color: calendarView === view.id ? theme.accentLight : theme.textMuted,
                      border: "none",
                      borderRadius: 6,
                      padding: isMobile ? "4px 8px" : "5px 10px",
                      fontSize: isMobile ? 8.5 : 9,
                      fontWeight: calendarView === view.id ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
              
              {/* Navigation Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={goToPrevious}
                  style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: 8,
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderMuted}`,
                    color: theme.textMuted,
                    fontSize: isMobile ? 14 : 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.accentDim;
                    e.currentTarget.style.borderColor = theme.accentDimBorder;
                    e.currentTarget.style.color = theme.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.bgCard;
                    e.currentTarget.style.borderColor = theme.borderMuted;
                    e.currentTarget.style.color = theme.textMuted;
                  }}
                  aria-label="Previous period"
                >
                  ‹
                </button>
                
                <button
                  onClick={goToNext}
                  style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    borderRadius: 8,
                    background: theme.bgCard,
                    border: `1px solid ${theme.borderMuted}`,
                    color: theme.textMuted,
                    fontSize: isMobile ? 14 : 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.accentDim;
                    e.currentTarget.style.borderColor = theme.accentDimBorder;
                    e.currentTarget.style.color = theme.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.bgCard;
                    e.currentTarget.style.borderColor = theme.borderMuted;
                    e.currentTarget.style.color = theme.textMuted;
                  }}
                  aria-label="Next period"
                >
                  ›
                </button>
              </div>
              
              {/* Legend */}
              {!isMobile && (
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Deadlines", color: "#f43f5e" },
                    { label: "Meetings", color: theme.accent },
                    { label: "Reviews", color: "#a78bfa" },
                  ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                      <span style={{ fontSize: 9.5, color: theme.textDim }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          overflowY: "auto",
          border: `1px solid ${theme.borderMuted}`,
          borderRadius: "0 0 12px 12px",
          borderTop: "none",
        }}
      >
        {days.map((day, di) => {
          const dayEvents = events.filter((e) => e.date === dateKeys[di]);
          const isLastInRow = (di + 1) % gridColumns === 0;
          const isLastRow = di >= days.length - gridColumns;
          
          // Calculate minimum height based on view
          const minHeight = isMobile 
            ? 200 
            : calendarView === "month" 
              ? 160 
              : calendarView === "2weeks" 
                ? 180 
                : 200;

          return (
            <div
              key={`${day.date}-${di}`}
              style={{
                borderRight: isMobile || isLastInRow ? "none" : `1px solid ${theme.borderMuted}`,
                borderBottom: isMobile && di < days.length - 1 ? `1px solid ${theme.borderMuted}` : isLastRow ? "none" : `1px solid ${theme.borderMuted}`,
                display: "flex",
                flexDirection: "column",
                minHeight,
                background: day.isToday ? theme.accentGlow : "transparent",
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  padding: calendarView === "month" ? "8px 10px" : "10px 12px",
                  borderBottom: `1px solid ${theme.borderMuted}`,
                  flexShrink: 0,
                  background: day.isToday ? theme.accentDimBorder : theme.bgCard,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: calendarView === "month" ? 11 : 12,
                    fontWeight: day.isToday ? 700 : 500,
                    color: day.isToday ? theme.accentLight : theme.textMuted,
                  }}
                >
                  {day.label}
                </span>
                <span style={{ fontSize: calendarView === "month" ? 9 : 9.5, color: theme.textDim }}>
                  {calendarView === "month" ? day.dayNum : day.date.split(" ").slice(1).join(" ")}
                </span>
              </div>

              {/* Events */}
              <div
                style={{
                  flex: 1,
                  padding: calendarView === "month" ? "6px 5px" : "8px 6px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: calendarView === "month" ? 4 : 5,
                }}
              >
                {dayEvents.slice(0, calendarView === "month" ? 3 : undefined).map((ev, ei) => {
                  const textColor = getContrastTextColor(ev.color);
                  const hoverColor = getLighterColor(ev.color, 0.1);
                  const isSelected = selectedEvent?.id === ev.id;
                  
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(isSelected ? null : ev)}
                      style={{
                        padding: calendarView === "month" ? "6px 8px" : "8px 10px",
                        borderRadius: calendarView === "month" ? 6 : 8,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: ev.color,
                        border: isSelected ? `2px solid ${theme.accent}` : `1px solid ${ev.color}`,
                        animation: `fadeSlideIn 0.3s ease ${ei * 60}ms both`,
                        boxShadow: isSelected ? `0 4px 12px ${ev.color}40` : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = hoverColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = ev.color;
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: calendarView === "month" ? 2 : 3 }}>
                        <span style={{ fontSize: calendarView === "month" ? 9 : 10, color: textColor }}>{typeIcon(ev.type)}</span>
                        <span
                          style={{
                            fontSize: calendarView === "month" ? 8.5 : 9.5,
                            color: textColor,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            opacity: 0.85,
                          }}
                        >
                          {ev.type}
                        </span>
                      </div>
                      <div style={{ fontSize: calendarView === "month" ? 10 : 11, color: textColor, lineHeight: 1.4, fontWeight: 600 }}>
                        {calendarView === "month" && ev.title.length > 40 ? ev.title.slice(0, 40) + "..." : ev.title}
                      </div>
                      {calendarView !== "month" && (
                        <>
                          <div style={{ fontSize: 9.5, color: textColor, marginTop: 3, opacity: 0.85 }}>{ev.time}</div>
                          {/* Source Email Pill */}
                          <div
                            style={{
                              marginTop: 5,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: `${textColor}15`,
                              borderRadius: 5,
                              padding: "2px 6px",
                            }}
                          >
                            <span style={{ fontSize: 8.5, color: textColor, opacity: 0.75 }}>from</span>
                            <span
                              style={{
                                fontSize: 8.5,
                                color: textColor,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 80,
                              }}
                            >
                              {ev.source?.from || "Unknown"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {calendarView === "month" && dayEvents.length > 3 && (
                  <div
                    style={{
                      padding: "4px 6px",
                      fontSize: 9,
                      color: theme.textDim,
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    +{dayEvents.length - 3} more
                  </div>
                )}
                {dayEvents.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: theme.textDim,
                      fontSize: 11,
                      minHeight: calendarView === "month" ? 100 : calendarView === "2weeks" ? 120 : 140,
                      opacity: 0.3,
                    }}
                  >
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Flyout */}
      {selectedEvent && (
        <>
          {/* Backdrop */}
          {!isMobile && (
            <div
              onClick={() => setSelectedEvent(null)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 50,
                animation: "fadeIn 0.2s ease both",
              }}
            />
          )}
          
          {/* Dialog */}
          <div
            style={{
              position: "fixed",
              top: isMobile ? "auto" : "50%",
              left: isMobile ? 0 : "50%",
              bottom: isMobile ? 0 : "auto",
              right: isMobile ? 0 : "auto",
              transform: isMobile ? "none" : "translate(-50%, -50%)",
              background: theme.bg,
              border: `2px solid ${selectedEvent.color}`,
              borderRadius: isMobile ? "20px 20px 0 0" : 16,
              padding: 0,
              width: isMobile ? "100%" : isTablet ? 480 : 560,
              maxWidth: isMobile ? "100%" : "90vw",
              maxHeight: isMobile ? "85vh" : "80vh",
              boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${selectedEvent.color}25`,
              animation: isMobile ? "fadeSlideIn 0.25s ease both" : "fadeIn 0.2s ease both",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header with Color Bar */}
            <div
              style={{
                background: selectedEvent.color,
                padding: isMobile ? "20px 20px 16px" : "24px 28px 20px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      fontSize: 24,
                      color: getContrastTextColor(selectedEvent.color),
                      opacity: 0.9,
                    }}
                  >
                    {typeIcon(selectedEvent.type)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: getContrastTextColor(selectedEvent.color),
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      opacity: 0.85,
                    }}
                  >
                    {selectedEvent.type}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setShowSourceEmail(false);
                  }}
                  style={{
                    background: `${getContrastTextColor(selectedEvent.color)}20`,
                    border: "none",
                    color: getContrastTextColor(selectedEvent.color),
                    fontSize: 20,
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "6px 10px",
                    borderRadius: 8,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${getContrastTextColor(selectedEvent.color)}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${getContrastTextColor(selectedEvent.color)}20`;
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: getContrastTextColor(selectedEvent.color), lineHeight: 1.3, marginBottom: 8 }}>
                {selectedEvent.title}
              </div>
              <div style={{ fontSize: 13, color: getContrastTextColor(selectedEvent.color), lineHeight: 1.4, opacity: 0.85 }}>
                {selectedEvent.date} · {selectedEvent.time}
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: isMobile ? "20px 20px" : "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* AI Summary Section - PRIMARY */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.accentLight,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>◎</span> AI SUMMARY
                </div>
                <div
                  style={{
                    background: theme.gradBanner,
                    borderRadius: 12,
                    padding: isMobile ? "16px" : "18px 20px",
                    border: `1px solid ${theme.accentDimBorder}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 1.7, fontWeight: 500 }}>
                    {selectedEvent.type === "deadline"
                      ? `This is a critical deadline that requires your attention. The event was automatically extracted from an email and identified as high priority. Make sure to complete all necessary actions before ${selectedEvent.time}.`
                      : selectedEvent.type === "meeting"
                      ? `This meeting has been scheduled and requires your participation. Review the context from the source email to prepare. Ensure you're available at the specified time and have any necessary materials ready.`
                      : `This review deadline is approaching. The AI has identified this as requiring your approval or feedback. Plan to allocate time to thoroughly review the materials and provide your input before the deadline.`}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: theme.accentLight,
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
                  value={eventNotes[selectedEvent.id] || ""}
                  onChange={(e) => setEventNotes({ ...eventNotes, [selectedEvent.id]: e.target.value })}
                  placeholder="Add notes, reminders, or action items for this event..."
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

              {/* Source Email Section - SECONDARY */}
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
                {showSourceEmail && selectedEvent.source && (
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
                      {selectedEvent.source.subject}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                      From {selectedEvent.source.from} · {selectedEvent.source.time}
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
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    // Save functionality - closes the dialog
                    // Notes are already saved in real-time via the textarea onChange
                    setSelectedEvent(null);
                  }}
                  style={{
                    flex: 1,
                    background: selectedEvent.color,
                    color: getContrastTextColor(selectedEvent.color),
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 700,
                    transition: "all 0.2s",
                    boxShadow: `0 4px 12px ${selectedEvent.color}40`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 6px 16px ${selectedEvent.color}50`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${selectedEvent.color}40`;
                  }}
                >
                  💾 Save
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
                      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
                      setSelectedEvent(null);
                    }
                  }}
                  style={{
                    flex: 0.6,
                    background: "transparent",
                    color: "#f43f5e",
                    border: `1px solid #f43f5e`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.15s",
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
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
