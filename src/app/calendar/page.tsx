"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CampusEvent } from "@/lib/data";
import { useAuth } from "@/components/auth-context";
import { useCampusData } from "@/components/campus-data-context";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const { user } = useAuth();
  const { events, clubs, error } = useCampusData();

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
    setDirection(-1);
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    setDirection(1);
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
        className="mb-8 text-3xl font-bold tracking-tight text-white"
      >
        Calendar
      </motion.h1>
      {error && <p className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h2
              key={`${year}-${month}`}
              custom={direction}
              variants={monthVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-center text-base font-semibold text-white sm:text-xl"
            >
              {monthName}
            </motion.h2>
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-white/40 sm:text-xs mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2"><span className="sm:hidden">{d.slice(0, 1)}</span><span className="hidden sm:inline">{d}</span></div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${year}-${month}-grid`}
            custom={direction}
            variants={monthVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateKey = formatDateKey(year, month, day);
              const dayEvents = eventsByDate[dateKey] || [];
              const isSelected = selectedDate === dateKey;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

              return (
                <motion.button
                  key={dateKey}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`relative flex min-h-10 flex-col items-center justify-center rounded-lg py-1 text-xs transition sm:min-h-0 sm:rounded-xl sm:py-2 sm:text-sm ${
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
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">
              Events on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-white/40">No events on this day.</p>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="grid gap-4 md:grid-cols-2"
              >
                {selectedEvents.map((ev) => {
                  const club = clubs.find((c) => c.slug === ev.clubSlug);
                  return (
                    <motion.div
                      key={ev.id}
                      variants={fadeUp}
                      transition={{ type: "spring", bounce: 0.12, visualDuration: 0.4 }}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    >
                      <Link
                        href={`/events/${ev.id}`}
                        className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
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
                        <h4 className="text-base font-semibold text-white transition-colors group-hover:text-emerald-300">{ev.title}</h4>
                        <div className="mt-3 space-y-1.5 text-sm text-white/40">
                          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{ev.location}</div>
                          <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{ev.rsvps} / {ev.capacity} RSVPed</div>
                        </div>
                        {user?.role === "participant" && (
                          <span
                            className="mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                          >
                            RSVP
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
