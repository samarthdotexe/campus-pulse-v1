"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { useAuth } from "@/components/auth-context";
import { useCampusData } from "@/components/campus-data-context";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ClubPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = use(params);
  const { user } = useAuth();
  const { clubs, events, loading } = useCampusData();
  const club = clubs.find((c) => c.slug === clubSlug);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-white/50 sm:px-6">Loading club…</div>;
  if (!club) notFound();

  const clubEvents = events
    .filter((e) => e.clubSlug === club.slug)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative min-h-screen">
      <section className="relative h-[50vh] w-full">
        <WebsiteShaderCanvas
          preset="aurora-veil"
          tone="dark"
          className="absolute inset-0 h-full w-full"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex h-full flex-col items-start justify-end px-4 pb-10 sm:px-6 sm:pb-12"
          >
            <div className="mx-auto w-full max-w-6xl">
              <motion.div variants={fadeUp} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}>
                <Link
                  href="/clubs"
                  className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All Clubs
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }} className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
                {club.logo ? <img src={club.logo} alt={`${club.name} logo`} className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-2xl" /> : <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold shadow-2xl"
                  style={{
                    backgroundColor: `${club.color}20`,
                    color: club.color,
                    boxShadow: `0 8px 32px ${club.color}30`,
                  }}
                >
                  {club.name.charAt(0)}
                </div>}
                <div>
                  <div
                    className="mb-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${club.color}15`,
                      color: club.color,
                    }}
                  >
                    {club.category}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {club.name}
                  </h1>
                  <p className="mt-1 text-lg text-white/50">{club.tagline}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </WebsiteShaderCanvas>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm leading-relaxed text-white/60">
                {club.description}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {club.memberCount}
                  </div>
                  <div className="mt-1 text-xs text-white/40">Members</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {clubEvents.length}
                  </div>
                  <div className="mt-1 text-xs text-white/40">Events</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-6 text-2xl font-bold text-white"
            >
              Upcoming Events
            </motion.h2>

            {clubEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center"
              >
                <Calendar className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-4 text-white/40">
                  No upcoming events from {club.name} yet.
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="space-y-4"
              >
                {clubEvents.map((event) => {
                  const fillPercent = Math.round(
                    (event.rsvps / event.capacity) * 100
                  );

                  return (
                    <motion.div
                      key={event.id}
                      variants={fadeUp}
                      transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
                      whileHover={{ x: 4, transition: { duration: 0.15 } }}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
                            {event.title}
                          </h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                            {event.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/40">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(event.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at {event.time}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              {event.rsvps} / {event.capacity}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-medium text-white/40">
                            {fillPercent}% filled
                          </div>
                          <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${fillPercent}%`,
                                backgroundColor: club.color,
                              }}
                            />
                          </div>
                          {user?.role === "participant" && (
                            <Link
                              href={`/events/${event.id}/rsvp`}
                              className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                              style={{ backgroundColor: club.color }}
                            >
                              RSVP
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
