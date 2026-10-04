"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  summary: string;
  start: Date;
  end: Date;
  location: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Vorlesung: "bg-blue-500/30 border-l-blue-400",
  Übung: "bg-emerald-500/30 border-l-emerald-400",
  Tutorium: "bg-amber-500/30 border-l-amber-400",
  "Praktikum/Übung (Voraussetzung für Modulprüfung)": "bg-purple-500/30 border-l-purple-400",
};

const CATEGORY_ICONS: Record<string, string> = {
  Vorlesung: "📖",
  Übung: "✏️",
  Tutorium: "👥",
  "Praktikum/Übung (Voraussetzung für Modulprüfung)": "🔬",
};

function parseIcs(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventBlocks = text.split("BEGIN:VEVENT");

  for (const block of eventBlocks) {
    if (!block.includes("END:VEVENT")) continue;

    const summaryMatch = block.match(/SUMMARY:(.+)/);
    const dtStartMatch = block.match(/DTSTART[^:]*:(.+)/);
    const dtEndMatch = block.match(/DTEND[^:]*:(.+)/);
    const locationMatch = block.match(/LOCATION:(.+)/);
    const categoryMatch = block.match(/CATEGORIES:(.+)/);

    if (summaryMatch && dtStartMatch && dtEndMatch) {
      const parseDate = (raw: string) => {
        const cleaned = raw.replace(/TZID=[^\s:]+/, "").trim();
        const str = cleaned.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6");
        return new Date(str + "Z");
      };

      events.push({
        summary: summaryMatch[1].trim(),
        start: parseDate(dtStartMatch[1]),
        end: parseDate(dtEndMatch[1]),
        location: locationMatch ? locationMatch[1].trim() : "",
        category: categoryMatch ? categoryMatch[1].trim() : "",
      });
    }
  }

  return events;
}

function getWeekEvents(events: CalendarEvent[]) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const expanded: CalendarEvent[] = [];

  for (const ev of events) {
    const evStart = new Date(ev.start);
    const evEnd = new Date(ev.end);

    if (evStart <= sunday && evEnd >= monday) {
      expanded.push(ev);
    }
  }

  expanded.sort((a, b) => a.start.getTime() - b.start.getTime());
  return expanded;
}

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setTiltX(x);
      setTiltY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    fetch("/schedule.ics")
      .then((res) => res.text())
      .then((text) => {
        const events = parseIcs(text);
        const week = getWeekEvents(events);
        setWeekEvents(week);

        const now = new Date();
        const today = week.filter((ev) => {
          const evDate = ev.start.toDateString();
          return evDate === now.toDateString();
        });
        setTodayEvents(today);
      })
      .catch((err) => console.error("Failed to load calendar:", err));
  }, []);

  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayDate = new Date();

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const shortSummary = (summary: string) => {
    const parts = summary.split(".");
    return parts.length > 2 ? parts.slice(1, 3).join(".").trim() : summary;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Parallax Background Image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          transform: `translate3d(0, ${scrollY * 0.4}px, 0) scale(1.1)`,
          willChange: "transform",
        }}
      >
        <img
          src="/background.jpg"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${tiltX * 0.3}px, ${tiltY * 0.3}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translateY(${scrollY * (Math.random() * 0.3 + 0.1)}px)`,
              animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-8 text-white/80 text-sm">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
            </svg>
          </div>
        </div>

        {/* Hero section with liquid glass */}
        <div
          className="liquid-glass rounded-3xl p-8 mb-6 text-center"
          style={{
            transform: `perspective(1000px) rotateY(${tiltX * 0.02}deg) rotateX(${-tiltY * 0.02}deg)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            📚 Mein Studium
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            FH Münster · ETI
          </p>
        </div>

        {/* Quick actions row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: "📅", label: "Kalender" },
            { icon: "📖", label: "Vorlesungen" },
            { icon: "🧭", label: "Campus" },
            { icon: "📊", label: "Noten" },
          ].map((item) => (
            <div
              key={item.label}
              className="liquid-glass rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-white/80 text-xs">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Today's schedule widget */}
        <div
          className="liquid-glass rounded-3xl p-6 mb-6"
          style={{
            transform: `translateY(${scrollY * -0.05}px)`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Heute</h2>
            <span className="text-white/50 text-sm">
              {todayDate.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((ev, i) => {
                const colorClass = CATEGORY_COLORS[ev.category] || "bg-gray-500/30 border-l-gray-400";
                return (
                  <div
                    key={i}
                    className={`rounded-xl ${colorClass} p-3 flex items-start gap-3 border-l-2`}
                  >
                    <div className="flex-shrink-0 w-16 text-right">
                      <div className="text-white/60 text-sm font-mono">
                        {formatTime(ev.start)}
                      </div>
                      <div className="text-white/40 text-[10px] font-mono">
                        {formatTime(ev.end)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {shortSummary(ev.summary)}
                      </div>
                      {ev.location && (
                        <div className="text-white/40 text-xs mt-0.5">
                          📍 {ev.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-white/40 text-sm text-center py-4">
              Keine Vorlesungen heute
            </div>
          )}
        </div>

        {/* Weekly calendar widget */}
        <div
          className="liquid-glass rounded-3xl p-6 mb-6"
          style={{
            transform: `translateY(${scrollY * -0.03}px)`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Diese Woche</h2>
            <span className="text-white/50 text-sm">{weekEvents.length} Events</span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === todayDate.toDateString();
              return (
                <div
                  key={i}
                  className={`text-center py-2 rounded-xl ${
                    isToday ? "bg-white/20" : ""
                  }`}
                >
                  <div className="text-white/40 text-[10px]">{DAY_LABELS[i]}</div>
                  <div
                    className={`text-sm font-semibold mt-0.5 ${
                      isToday ? "text-white" : "text-white/60"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Events by day */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {weekDays.map((day, i) => {
              const dayEvents = weekEvents.filter(
                (ev) => ev.start.toDateString() === day.toDateString()
              );
              if (dayEvents.length === 0) return null;
              const isToday = day.toDateString() === todayDate.toDateString();

              return (
                <div key={i}>
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      isToday ? "text-white" : "text-white/50"
                    }`}
                  >
                    {DAY_LABELS[i]}.{", " + day.getDate()}.
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((ev, j) => {
                      const icon = CATEGORY_ICONS[ev.category] || "📌";
                      return (
                        <div
                          key={j}
                          className={`rounded-lg px-2 py-1.5 text-xs flex items-center gap-2 ${
                            isToday ? "bg-white/10" : "bg-white/5"
                          }`}
                        >
                          <span className="text-sm">{icon}</span>
                          <span className="text-white/60 font-mono flex-shrink-0">
                            {formatTime(ev.start)}
                          </span>
                          <span className="text-white/80 truncate">
                            {shortSummary(ev.summary)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="mt-auto liquid-glass rounded-2xl px-6 py-4 flex items-center justify-between">
          {[
            { icon: "🏠", label: "Home", active: true },
            { icon: "📅", label: "Kalender", active: false },
            { icon: "📊", label: "Noten", active: false },
            { icon: "👤", label: "Profil", active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex flex-col items-center gap-1 ${
                tab.active ? "text-blue-400" : "text-white/40"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center mt-4 mb-2">
          <div className="w-32 h-1 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
