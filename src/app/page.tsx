"use client";

import Link from "next/link";
import Image from "next/image";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { useAuth } from "@/components/auth-context";
import { useCampusData } from "@/components/campus-data-context";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const CLUB_IMAGES: Record<string, string> = {
  "tech-club": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop&q=80",
  "entrepreneur-club": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop&q=80",
  "ai-ml-club": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop&q=80",
  "dsa-club": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=400&fit=crop&q=80",
  "sports-club": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=400&fit=crop&q=80",
  "communications-club": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=400&fit=crop&q=80",
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function HomePage() {
  const { user } = useAuth();
  const { clubs, events, error } = useCampusData();
  const upcomingEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full">
        <WebsiteShaderCanvas
          preset="aurora-veil"
          tone="dark"
          className="absolute inset-0 h-full w-full"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex h-full flex-col items-center justify-center px-4 text-center sm:px-6"
          >
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="mb-2 text-sm font-medium uppercase tracking-[0.16em] text-white"
            >
              Welcome to
            </motion.p>
            <motion.h1
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="text-[42px] font-bold leading-none tracking-tight text-white"
            >
              Campus <span className="text-[#1de9b6]">Pulse</span>
            </motion.h1>
            <motion.div variants={fadeUp} className="mt-4 h-[3px] w-[120px] rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
            <motion.p variants={fadeUp} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }} className="mt-7 max-w-5xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Everything happening on campus, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">in one place</span>
            </motion.p>
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="mt-5 max-w-2xl text-lg text-white/60 sm:text-xl"
            >
              Stop missing events you&apos;d love. Browse hackathons, workshops,
              open mics, and tournaments — all from every club on campus.
            </motion.p>
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="mt-4 text-sm tracking-wide text-white/40 sm:text-base"
            >
              One Campus. One Calendar. Zero <span className="font-bold text-white/70">FOMO</span>
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <motion.a
                href="#upcoming"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/20"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/clubs"
                  className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Explore Clubs
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </WebsiteShaderCanvas>
      </section>

      {error && <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6"><p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p></div>}

      {/* Stats Bar */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="border-y border-white/10 bg-black/60 backdrop-blur-xl"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { label: "Active Clubs", value: clubs.length.toString() },
            { label: "Upcoming Events", value: events.length.toString() },
            { label: "Total RSVPs", value: events.reduce((sum, e) => sum + e.rsvps, 0).toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center sm:px-6 sm:py-8">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Upcoming Events */}
      <section id="upcoming" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <motion.h2
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-white"
            >
              Upcoming Events
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
              className="mt-2 text-white/50"
            >
              What&apos;s happening on campus this week
            </motion.p>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {upcomingEvents.map((event) => {
            const club = clubs.find((c) => c.slug === event.clubSlug);
            const fillPercent = Math.round(
              (event.rsvps / event.capacity) * 100
            );
            const isParticipant = user?.role === "participant";
            const hasRsvped = event.rsvps >= event.capacity;

            return (
              <motion.div
                key={event.id}
                variants={fadeUp}
                transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div
                  className="absolute top-0 left-0 h-1 w-full opacity-60"
                  style={{ backgroundColor: club?.color ?? "#7bd8c4" }}
                />

                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${club?.color ?? "#7bd8c4"}15`,
                      color: club?.color ?? "#7bd8c4",
                    }}
                  >
                    {club?.name ?? "Club"}
                  </div>
                  <span className="text-xs text-white/40">
                    {fillPercent}% filled
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
                  {event.description}
                </p>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
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

                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: club?.color ?? "#7bd8c4" }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${fillPercent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  />
                </div>

                {isParticipant && (
                  <Link
                    href={`/events/${event.id}/rsvp`}
                    className={`mt-4 block w-full rounded-lg py-2 text-center text-sm font-semibold transition-opacity ${hasRsvped
                        ? "cursor-not-allowed bg-white/5 text-white/30"
                        : "bg-white/10 text-white hover:bg-white/15"
                      }`}
                    style={!hasRsvped ? { color: club?.color ?? "#7bd8c4" } : undefined}
                    onClick={(e) => hasRsvped && e.preventDefault()}
                  >
                    {hasRsvped ? "Full" : "RSVP"}
                  </Link>
                )}

                {user?.role === "committee" && event.createdBy === user.id && (
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="mt-2 block w-full rounded-lg bg-emerald-500/10 py-2 text-center text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                  >
                    Edit Event
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Club Quick Links */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
            className="mb-8 text-3xl font-bold tracking-tight text-white"
          >
            Browse by Club
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {clubs.map((club) => {
              const eventCount = events.filter((e) => e.clubSlug === club.slug).length;
              return (
                <motion.div
                  key={club.slug}
                  variants={fadeUp}
                  transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
                >
                  <Link
                    href={`/clubs/${club.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 transition-all hover:scale-[1.02] hover:border-white/25"
                  >
                    <div className="relative h-36 w-full overflow-hidden">
                      <Image
                        src={CLUB_IMAGES[club.slug] ?? ""}
                        alt={club.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    </div>
                    <div className="relative z-10 -mt-8 flex flex-col px-5 pb-5">
                      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-emerald-300">
                        {club.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        {club.tagline}
                      </p>
                      <div className="mt-3 text-xs text-white/30">
                        {eventCount} event{eventCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden border-t border-white/10"
      >
        <SonarGrid
          className="bg-background flex h-[320px] w-full flex-col"
          color="#7bd8c4"
          pingEvery={2.4}
          speed={260}
          ringWidth={90}
          amplitude={2.2}
          interactive={true}
          spacing={26}
          baseOpacity={0.28}
          pingArea={[0.22, 0.18, 0.78, 0.82]}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="flex h-full flex-col items-center justify-center px-6 text-center"
          >
            <motion.h2
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
              className="text-3xl font-bold text-white sm:text-4xl"
            >
              Never miss a campus event again
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
              className="mt-3 max-w-md text-white/50"
            >
              One calendar. Every club. Automatic reminders delivered to your
              inbox every Monday.
            </motion.p>
            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", bounce: 0.2, visualDuration: 0.4 }}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/20"
            >
              Get Weekly Digest
            </motion.button>
          </motion.div>
        </SonarGrid>
      </motion.section>
    </div>
  );
}
