"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { CampusEvent, RsvpSubmission } from "@/lib/data";
import { motion } from "motion/react";
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Users, TicketCheck } from "lucide-react";
import { useCampusData } from "@/components/campus-data-context";

function answerSummary(rsvp: RsvpSubmission, event: CampusEvent) {
  return event.rsvpQuestions.map((question) => {
    const answer = rsvp.answers[question.id];
    if (answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0)) return null;
    return `${question.label}: ${Array.isArray(answer) ? answer.join(", ") : String(answer)}`;
  }).filter(Boolean) as string[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { events, organizerRsvps, error } = useCampusData();
  const [selectedEventId, setSelectedEventId] = useState("all");
  const organizerEvents = useMemo(() => events.filter((event) => user?.role === "admin" || (user?.role === "committee" && (event.createdBy === user.id || event.clubSlug === user.clubSlug))), [events, user]);
  const visibleEventIds = new Set(organizerEvents.map((event) => event.id));
  const rsvps = organizerRsvps.filter((rsvp) => visibleEventIds.has(rsvp.eventId));
  const selectedRsvps = rsvps.filter((rsvp) => selectedEventId === "all" || rsvp.eventId === selectedEventId);
  const selectedEvent = (id: string) => organizerEvents.find((event) => event.id === id);
  const trackedCount = rsvps.length;
  const seatCount = organizerEvents.reduce((sum, event) => sum + event.capacity, 0);
  const actualCount = organizerEvents.reduce((sum, event) => sum + event.rsvps, 0);
  const fillRate = seatCount ? Math.round(actualCount / seatCount * 100) : 0;
  const uniqueParticipantCount = new Set(rsvps.map((rsvp) => rsvp.userId)).size;
  const input = "rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50";

  if (!user || (user.role !== "admin" && user.role !== "committee")) return <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6"><h1 className="text-2xl font-bold text-white">Organizer dashboard</h1><p className="mt-2 text-white/50">Sign in as a Club Member or Faculty Member / Admin to view event analytics.</p><Link href="/login" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Log in</Link></div>;

  const stats = [
    { label: "Events you manage", value: organizerEvents.length, icon: CalendarDays },
    { label: "RSVPs recorded", value: trackedCount, icon: TicketCheck },
    { label: "Unique participants", value: uniqueParticipantCount, icon: Users },
    { label: "Capacity filled", value: `${fillRate}%`, icon: ChartNoAxesCombined },
  ];

  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Event operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Organizer Dashboard</h1><p className="mt-2 text-sm text-white/45">RSVP activity and capacity across the events you manage.</p></div>
      <Link href="/events/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-2.5 text-sm font-semibold text-black">Create event <ArrowRight className="h-4 w-4"/></Link>
    </motion.div>
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ label, value, icon: Icon }, index) => <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center justify-between"><span className="text-sm text-white/45">{label}</span><Icon className="h-4 w-4 text-emerald-300"/></div><p className="mt-4 text-3xl font-bold text-white">{value}</p></motion.div>)}</div>
    <div className="mb-8 grid gap-5 lg:grid-cols-2">{organizerEvents.map((event) => {
      const eventRsvps = rsvps.filter((rsvp) => rsvp.eventId === event.id);
      const fill = event.capacity ? Math.round(event.rsvps / event.capacity * 100) : 0;
      return <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{event.title}</h2><p className="mt-1 text-xs text-white/40">{event.date} · {event.time} · {event.location}</p></div><Link href={`/events/${event.id}/edit`} className="text-xs font-medium text-emerald-300 hover:text-emerald-200">Edit</Link></div><div className="mt-5 flex items-end justify-between"><span className="text-2xl font-bold text-white">{event.rsvps}<span className="text-sm font-normal text-white/40"> / {event.capacity} seats</span></span><span className="text-xs text-white/40">{eventRsvps.length} tracked sign-ups</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${Math.min(fill, 100)}%` }}/></div></div>;
    })}</div>
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5"><div><h2 className="text-lg font-semibold text-white">Participant RSVP tracking</h2><p className="mt-1 text-sm text-white/40">Submitted responses with participant and event details.</p></div><select aria-label="Filter RSVPs by event" value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} className={input}><option value="all" className="bg-black">All managed events</option>{organizerEvents.map((event) => <option key={event.id} value={event.id} className="bg-black">{event.title}</option>)}</select></div>
      {organizerEvents.length === 0 ? <div className="p-10 text-center"><p className="text-white/50">No events are assigned to your account yet.</p><p className="mt-2 text-sm text-white/35">Create an event to start tracking RSVPs here.</p></div> : selectedRsvps.length === 0 ? <div className="p-10 text-center text-sm text-white/40">No tracked participant submissions for this selection yet.</div> : <div className="divide-y divide-white/5">{selectedRsvps.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((rsvp) => {
        const event = selectedEvent(rsvp.eventId);
        if (!event) return null;
        const answers = answerSummary(rsvp, event);
        return <article key={rsvp.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start"><div><p className="font-medium text-white">{rsvp.participantName || "Former participant"}</p><p className="mt-1 text-xs text-white/40">Participant details are protected</p></div><div><p className="text-sm text-emerald-200">{event.title}</p><p className="mt-1 text-xs text-white/40">{event.date} · {event.time}</p>{answers.length > 0 && <ul className="mt-3 space-y-1 text-xs text-white/50">{answers.map((answer) => <li key={answer}>{answer}</li>)}</ul>}</div><time className="text-xs text-white/35">{new Date(rsvp.submittedAt).toLocaleString()}</time></article>;
      })}</div>}
    </section>
    {error && <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
  </div>;
}
