"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getEvents } from "@/lib/store";
import { clubs, CampusEvent } from "@/lib/data";
import { useAuth } from "@/components/auth-context";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { user } = useAuth();

  const events = useMemo(() => getEvents(), []);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CampusEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">Calendar</h1>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-white">{monthName}</h2>
          <button onClick={nextMonth} className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-white/40 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateKey = formatDateKey(year, month, day);
            const dayEvents = eventsByDate[dateKey] || [];
            const isSelected = selectedDate === dateKey;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`relative flex flex-col items-center rounded-xl py-2 text-sm transition ${
                  isSelected ? "bg-white/10 border border-white/20" : "border border-transparent hover:bg-white/5"
                } ${isToday ? "text-emerald-400 font-semibold" : "text-white/70"}`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const club = clubs.find((c) => c.slug === ev.clubSlug);
                      return (
                        <span
                          key={ev.id}
                          className="block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: club?.color ?? "#7bd8c4" }}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Events on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-white/40">No events on this day.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {selectedEvents.map((ev) => {
                const club = clubs.find((c) => c.slug === ev.clubSlug);
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${club?.color ?? "#7bd8c4"}15`, color: club?.color ?? "#7bd8c4" }}
                      >
                        {club?.name ?? "Club"}
                      </span>
                      <span className="text-xs text-white/40">{ev.time}</span>
                    </div>
                    <h4 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">{ev.title}</h4>
                    <div className="mt-3 space-y-1.5 text-sm text-white/40">
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{ev.location}</div>
                      <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{ev.rsvps} / {ev.capacity} RSVPed</div>
                    </div>
                    {user?.role === "participant" && (
                      <Link
                        href={`/events/${ev.id}/rsvp`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      >
                        RSVP
                      </Link>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
