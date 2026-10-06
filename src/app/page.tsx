"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  location: string;
  category: string;
}

const CATEGORY_STYLES: Record<string, { className: string; icon: string }> = {
  Vorlesung: { className: "bg-sky-400/15", icon: "◈" },
  Übung: { className: "bg-emerald-400/15", icon: "✦" },
  Tutorium: { className: "bg-amber-400/15", icon: "◎" },
  "Praktikum/Übung (Voraussetzung für Modulprüfung)": {
    className: "bg-violet-400/15",
    icon: "⌘",
  },
};

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function unfoldIcs(text: string) {
  return text.replace(/\r?\n[ \t]/g, "").replace(/\r/g, "");
}

function parseIcsDate(rawValue: string) {
  const raw = rawValue.trim();
  const value = raw.replace(/^TZID=[^:]+:/, "");
  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/
  );

  if (!match) return new Date(NaN);

  const [, year, month, day, hour = "0", minute = "0", second = "0", utc] =
    match;
  if (utc) {
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function parseIcs(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const block of unfoldIcs(text).split("BEGIN:VEVENT")) {
    if (!block.includes("END:VEVENT")) continue;

    const read = (name: string) =>
      block.match(new RegExp(`(?:^|\\n)${name}(?:;[^:]*)?:(.+)`))?.[1]?.trim() ??
      "";
    const start = parseIcsDate(read("DTSTART"));
    const end = parseIcsDate(read("DTEND"));

    if (!read("SUMMARY") || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      continue;
    }

    events.push({
      id: read("UID") || `${start.toISOString()}-${read("SUMMARY")}`,
      summary: read("SUMMARY"),
      start,
      end,
      location: read("LOCATION"),
      category: read("CATEGORIES"),
    });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekDays(date: Date) {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

function sameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function shortSummary(summary: string) {
  const parts = summary.split(".");
  return parts.length > 2 ? parts.slice(1, 3).join(".").trim() : summary;
}

function categoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? { className: "bg-slate-400/15", icon: "•" };
}

function EventMeta({ event }: { event: CalendarEvent }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/55">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden="true">◷</span>
        {formatTime(event.start)}–{formatTime(event.end)}
      </span>
      {event.location && (
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">⌖</span>
          {event.location}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCalendar = useCallback(async () => {
    try {
      const response = await fetch("/schedule.ics", { cache: "no-store" });
      if (!response.ok) throw new Error(`Calendar request failed: ${response.status}`);
      setEvents(parseIcs(await response.text()));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Kalender konnte nicht geladen werden:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCalendar();
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    const refresh = window.setInterval(() => void loadCalendar(), 5 * 60_000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, [loadCalendar]);

  const weekDays = useMemo(() => getWeekDays(now), [now]);
  const weekEvents = useMemo(
    () => {
      const weekEnd = new Date(weekDays[6]);
      weekEnd.setHours(23, 59, 59, 999);
      return events.filter(
        (event) => event.start <= weekEnd && event.end >= weekDays[0]
      );
    },
    [events, weekDays]
  );
  const currentEvent = useMemo(
    () => events.find((event) => event.start <= now && event.end > now),
    [events, now]
  );
  const nextEvent = useMemo(
    () => events.find((event) => event.start > now),
    [events, now]
  );
  const todayEvents = useMemo(
    () => events.filter((event) => sameDay(event.start, now)),
    [events, now]
  );

  const progress = currentEvent
    ? Math.min(
        100,
        Math.max(
          0,
          ((now.getTime() - currentEvent.start.getTime()) /
            (currentEvent.end.getTime() - currentEvent.start.getTime())) *
            100
        )
      )
    : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06101f] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src="/background.jpg"
          alt=""
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(86,164,255,.28),transparent_34%),linear-gradient(135deg,rgba(2,10,25,.35),rgba(1,5,14,.86))]" />
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-8 lg:px-12">
        <section className="glass-panel w-full overflow-hidden rounded-[2rem] p-4 sm:p-6 lg:p-8">
          <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-sky-200/65">
                <span className="status-dot" />
                Studium · FH Münster
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Guten Morgen, Leon<span className="text-sky-200">.</span>
              </h1>
              <p className="mt-2 text-sm text-white/50 sm:text-base">
                {formatDate(now)} · {formatTime(now)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void loadCalendar()}
                className="glass-button"
                aria-label="Kalender aktualisieren"
              >
                <span className="text-lg" aria-hidden="true">↻</span>
                <span className="hidden sm:inline">Aktualisieren</span>
              </button>
              <div className="glass-icon" aria-hidden="true">•••</div>
            </div>
          </header>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.85fr]">
            <article className="hero-widget glass-card relative overflow-hidden p-6 sm:p-8">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    {currentEvent ? "Gerade läuft" : "Aktueller Status"}
                  </p>
                  <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
                    {loading
                      ? "Kalender wird geladen …"
                      : currentEvent
                        ? shortSummary(currentEvent.summary)
                        : "Gerade ist frei"}
                  </h2>
                  {currentEvent ? (
                    <EventMeta event={currentEvent} />
                  ) : (
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
                      Keine laufende Veranstaltung. Zeit für eine kurze Pause oder
                      konzentriertes Arbeiten.
                    </p>
                  )}
                </div>
                <div className="current-icon" aria-hidden="true">
                  {currentEvent ? categoryStyle(currentEvent.category).icon : "☼"}
                </div>
              </div>
              {currentEvent && (
                <div className="relative z-10 mt-8">
                  <div className="mb-2 flex justify-between text-xs text-white/45">
                    <span>Fortschritt</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-300 to-cyan-100 transition-[width] duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </article>

            <article className="glass-card flex flex-col justify-between p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Als Nächstes</p>
                  <h2 className="mt-3 text-2xl font-semibold leading-tight">
                    {nextEvent ? shortSummary(nextEvent.summary) : "Nichts geplant"}
                  </h2>
                </div>
                <span className="glass-icon text-xl" aria-hidden="true">→</span>
              </div>
              {nextEvent ? (
                <>
                  <EventMeta event={nextEvent} />
                  <p className="mt-6 text-sm text-sky-100/70">
                    {sameDay(nextEvent.start, now)
                      ? `Heute um ${formatTime(nextEvent.start)}`
                      : nextEvent.start.toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                  </p>
                </>
              ) : (
                <p className="mt-8 text-sm text-white/45">
                  Für die kommenden Tage sind keine Termine vorhanden.
                </p>
              )}
            </article>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Heute", value: `${todayEvents.length}`, detail: "Termine", icon: "◷" },
              { label: "Lernfokus", value: "2 h", detail: "Platzhalter", icon: "◌" },
              { label: "Noten", value: "—", detail: "Bald verfügbar", icon: "⌁" },
            ].map((item) => (
              <article key={item.label} className="glass-card flex items-center gap-4 p-5">
                <div className="glass-icon text-xl text-sky-100/75" aria-hidden="true">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  <p className="text-xs text-white/40">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <article className="glass-card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Dein Überblick</p>
                  <h2 className="mt-2 text-xl font-semibold">Diese Woche</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                  {weekEvents.length} Termine
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day, index) => {
                  const dayEvents = weekEvents.filter((event) => sameDay(event.start, day));
                  const isToday = sameDay(day, now);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-28 rounded-2xl border p-2 transition-colors ${
                        isToday
                          ? "border-sky-200/40 bg-sky-200/10"
                          : "border-white/5 bg-white/[0.025]"
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-[10px] uppercase ${isToday ? "text-sky-100" : "text-white/35"}`}>
                          {DAY_LABELS[index]}
                        </div>
                        <div className={`mt-1 text-sm font-semibold ${isToday ? "text-white" : "text-white/60"}`}>
                          {day.getDate()}
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            title={event.summary}
                            className={`truncate rounded-lg ${categoryStyle(event.category).className} px-1.5 py-1 text-[9px] text-white/70`}
                          >
                            {formatTime(event.start)}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="px-1 text-[9px] text-white/35">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="glass-card p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="eyebrow">Deine Module</p>
                  <h2 className="mt-2 text-xl font-semibold">Schnellzugriff</h2>
                </div>
                <span className="text-xs text-white/35">Platzhalter</span>
              </div>
              <div className="space-y-2.5">
                {[
                  ["⌑", "Aufgaben", "Demnächst"],
                  ["⌘", "Campus", "Demnächst"],
                  ["✧", "Materialien", "Demnächst"],
                ].map(([icon, label, detail]) => (
                  <button
                    key={label}
                    type="button"
                    className="placeholder-row group w-full"
                    title={`${label} ist ein Platzhalter`}
                  >
                    <span className="glass-icon h-9 w-9 text-sm" aria-hidden="true">{icon}</span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm text-white/80">{label}</span>
                      <span className="block text-xs text-white/35">{detail}</span>
                    </span>
                    <span className="text-white/25 transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </article>
          </div>

          <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs text-white/35">
            <span>Liquid Study Space</span>
            <span>
              {lastUpdated
                ? `Kalender aktualisiert um ${formatTime(lastUpdated)}`
                : "Kalender wird synchronisiert …"}
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
