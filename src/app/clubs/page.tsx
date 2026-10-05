"use client";

import Link from "next/link";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { useCampusData } from "@/components/campus-data-context";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function ClubsPage() {
  const { clubs, events, error } = useCampusData();

  return (
    <div className="relative min-h-screen">
      <section className="relative h-[45vh] w-full">
        <SonarGrid
          className="bg-background flex h-full w-full flex-col"
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
            animate="visible"
            variants={stagger}
            className="flex h-full flex-col items-center justify-center px-4 text-center sm:px-6"
          >
            <motion.h1
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="text-5xl font-bold tracking-tight text-white sm:text-6xl"
            >
              Campus Clubs
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ type: "spring", bounce: 0.15, visualDuration: 0.6 }}
              className="mt-4 max-w-xl text-lg text-white/50"
            >
              Every registered club on campus, in one directory. Find your
              people.
            </motion.p>
          </motion.div>
        </SonarGrid>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {error && <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {clubs.map((club) => {
            const clubEvents = events.filter((e) => e.clubSlug === club.slug);
            const totalRsvps = clubEvents.reduce((s, e) => s + e.rsvps, 0);

            return (
              <motion.div
                key={club.slug}
                variants={fadeUp}
                transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  href={`/clubs/${club.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div
                    className="absolute top-0 left-0 h-1 w-full opacity-60 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: club.color }}
                  />

                  {club.logo ? <img src={club.logo} alt={`${club.name} logo`} className="mb-4 h-14 w-14 rounded-2xl object-cover" /> : <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold"
                    style={{
                      backgroundColor: `${club.color}15`,
                      color: club.color,
                    }}
                  >
                    {club.name.charAt(0)}
                  </div>}

                  <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-emerald-300">
                    {club.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-white/40">
                    {club.tagline}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/50">
                    {club.description}
                  </p>

                  <div className="mt-5 flex items-center gap-4 border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                      <Users className="h-3.5 w-3.5" />
                      {club.memberCount} members
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                      <Calendar className="h-3.5 w-3.5" />
                      {clubEvents.length} events
                    </span>
                    <span className="ml-auto text-xs text-white/30">
                      {totalRsvps} RSVPs
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white/30 transition-colors group-hover:text-emerald-400">
                    View club page
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
