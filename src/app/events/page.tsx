"use client";

import Link from "next/link";
import { getEvents } from "@/lib/store";
import { clubs } from "@/lib/data";
import { useAuth } from "@/components/auth-context";
import { hasUserRsvped } from "@/lib/store";
import { ArrowRight, Calendar, MapPin, Users, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AllEventsPage() {
  const events = getEvents();
  const { user } = useAuth();

  // Sort events by date (earliest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const clubCount = clubs.length;
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const filledSpots = events.reduce((sum, e) => sum + e.rsvps, 0);
  const participationRate = totalCapacity > 0 ? Math.round((filledSpots / totalCapacity) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back to Home
        </Link>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.3 }}
          className="text-4xl font-bold tracking-tight text-white"
        >
          All Events
        </motion.h1>

        <p className="mt-2 text-white/50">
          Browse all upcoming campus events organized by club. Create, edit, and RSVP for events.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
        className="mb-8 grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{clubCount}</div>
          <div className="text-xs text-white/40 mt-1">Clubs</div>
        </div>
        <div className="text-center border-l border-white/10">
          <div className="text-2xl font-bold text-white">{events.length}</div>
          <div className="text-xs text-white/40 mt-1">Events</div>
        </div>
        <div className="text-center border-l border-white/10">
          <div className="text-2xl font-bold text-white">{participationRate}%</div>
          <div className="text-xs text-white/40 mt-1">Fill Rate</div>
        </div>
      </motion.div>

      {/* Events List */}
      {sortedEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center"
        >
          <Calendar className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <h3 className="text-xl font-semibold text-white">No events yet</h3>
          <p className="mt-2 text-white/50">
            Be the first to create an event! Committee members can add new events here.
          </p>
          {(user?.role === "committee" || user?.role === "admin") && (
            <Link
              href="/events/new"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Create Your First Event
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-2"
        >
          <AnimatePresence mode="wait">
            {sortedEvents.map((event, index) => {
              const club = clubs.find((c) => c.slug === event.clubSlug);
              const isOwner = user?.role === "admin" || (user?.role === "committee" && (event.createdBy === user.id || event.clubSlug === user.clubSlug));
              const hasRsvped = user?.role === "participant" && hasUserRsvped(user.id, event.id);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    bounce: 0.15,
                    visualDuration: 0.4 + index * 0.03,
                  }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="relative group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.015] p-6 transition-colors hover:border-white/20"
                >
                  {/* Club color indicator */}
                  <div
                    className="absolute left-0 top-0 h-full w-1 opacity-50"
                    style={{ backgroundColor: club?.color ?? "#7bd8c4" }}
                  />

                  <div className="relative z-10">
                    <div className="mb-3 flex items-start justify-between">
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: `${club?.color ?? "#7bd8c4"}15`, color: club?.color ?? "#7bd8c4" }}
                      >
                        {club?.name ?? "Club"}
                      </span>
                      {isOwner && (
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </Link>
                      )}
                    </div>

                    <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
                      {event.title}
                    </h3>

                    <p className="mb-4 line-clamp-2 text-sm text-white/50">{event.description}</p>

                    <div className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/40">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {event.rsvps} / {event.capacity} RSVPed
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
                      >
                        View Details <ArrowRight className="h-3 w-3" />
                      </Link>

                      {user?.role === "participant" && (
                        <Link
                          href={`/events/${event.id}/rsvp`}
                          aria-disabled={hasRsvped || event.rsvps >= event.capacity}
                          onClick={(eventClick) => (hasRsvped || event.rsvps >= event.capacity) && eventClick.preventDefault()}
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${hasRsvped || event.rsvps >= event.capacity ? "cursor-not-allowed bg-white/5 text-white/35" : "bg-white text-black hover:bg-white/90"}`}
                        >
                          {hasRsvped ? "RSVP confirmed" : event.rsvps >= event.capacity ? "Full" : "RSVP"}
                        </Link>
                      )}
                      {isOwner && <Link href="/dashboard" className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20">View analytics</Link>}
                    </div>

                    {event.rsvps >= event.capacity && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-4 top-4 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20"
                      >
                        Full Event
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Event CTA for committee */}
      {(user?.role === "committee" || user?.role === "admin") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
          className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center"
        >
          <h3 className="text-lg font-semibold text-white">Ready to host an event?</h3>
          <p className="mt-1 text-sm text-white/50">
            Create a new event and share it with your campus community.
          </p>
          <Link
            href="/events/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:from-emerald-400 hover:to-teal-400"
          >
            <Calendar className="h-4 w-4" />
            Create New Event
          </Link>
        </motion.div>
      )}
    </div>
  );
}
