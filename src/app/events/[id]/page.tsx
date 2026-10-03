"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getEvents, deleteEvent } from "@/lib/store";
import { clubs } from "@/lib/data";
import { useAuth } from "@/components/auth-context";
import { Calendar, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const events = getEvents();
  const event = events.find((e) => e.id === params.id);

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Event not found</h1>
        <Link href="/calendar" className="mt-4 inline-block text-sm text-emerald-400 hover:underline">Back to calendar</Link>
      </div>
    );
  }

  const club = clubs.find((c) => c.slug === event.clubSlug);
  const fillPercent = Math.round((event.rsvps / event.capacity) * 100);
  const isOwner = user?.role === "admin" || (user?.role === "committee" && (event.createdBy === user.id || event.clubSlug === user.clubSlug));

  const handleDelete = () => {
    if (confirm("Delete this event?")) {
      deleteEvent(event.id);
      router.push("/calendar");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${club?.color ?? "#7bd8c4"}15`, color: club?.color ?? "#7bd8c4" }}
          >
            {club?.name ?? "Club"}
          </span>
          <span className="text-sm text-white/40">{fillPercent}% filled</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white">{event.title}</h1>
        <p className="mt-4 leading-relaxed text-white/60">{event.description}</p>

        <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-3 text-sm text-white/50">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at {event.time}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <Users className="h-4 w-4" />
            <span>{event.rsvps} / {event.capacity} RSVPed</span>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: club?.color ?? "#7bd8c4" }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
        </div>

        {event.rsvpQuestions.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <h2 className="mb-3 text-sm font-semibold text-white/70">RSVP Form Questions</h2>
            <ul className="space-y-2">
              {event.rsvpQuestions.map((q) => (
                <li key={q.id} className="flex items-center gap-2 text-sm text-white/50">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/30">{q.type}</span>
                  {q.label}{q.required && <span className="text-red-400">*</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6"
        >
          {!user && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/login" className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20">
                Login to RSVP
              </Link>
            </motion.div>
          )}
          {user?.role === "participant" && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={`/events/${event.id}/rsvp`} className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
                RSVP
              </Link>
            </motion.div>
          )}
          {isOwner && (
            <>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href={`/events/${event.id}/edit`} className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20">
                  Edit
                </Link>
              </motion.div>
              <motion.button
                onClick={handleDelete}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Delete
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
