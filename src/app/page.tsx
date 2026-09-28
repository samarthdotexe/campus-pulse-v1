import Link from "next/link";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { events, clubs } from "@/lib/data";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const upcomingEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative min-h-screen">
      {/* Hero Section with Aurora Veil Background */}
      <section className="relative h-[85vh] w-full">
        <WebsiteShaderCanvas
          preset="aurora-veil"
          tone="dark"
          className="absolute inset-0 h-full w-full"
        >
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-7xl">
              Everything happening on campus,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                in one place
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/60 sm:text-xl">
              Stop missing events you'd love. Browse hackathons, workshops,
              open mics, and tournaments — all from every club on campus.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#upcoming"
                className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/20"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/clubs"
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                Explore Clubs
              </Link>
            </div>
          </div>
        </WebsiteShaderCanvas>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10">
          {[
            { label: "Active Clubs", value: clubs.length.toString() },
            { label: "Upcoming Events", value: events.length.toString() },
            { label: "Total RSVPs", value: events.reduce((sum, e) => sum + e.rsvps, 0).toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="upcoming" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Upcoming Events
            </h2>
            <p className="mt-2 text-white/50">
              What's happening on campus this week
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => {
            const club = clubs.find((c) => c.slug === event.clubSlug);
            const fillPercent = Math.round(
              (event.rsvps / event.capacity) * 100
            );

            return (
              <div
                key={event.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]"
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

                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
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
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${fillPercent}%`,
                      backgroundColor: club?.color ?? "#7bd8c4",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Club Quick Links */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-white">
            Browse by Club
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club.slug}
                href={`/clubs/${club.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    backgroundColor: `${club.color}15`,
                    color: club.color,
                  }}
                >
                  {club.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {club.name}
                  </h3>
                  <p className="truncate text-sm text-white/40">
                    {club.tagline}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-white/50" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden border-t border-white/10">
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
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Never miss a campus event again
            </h2>
            <p className="mt-3 max-w-md text-white/50">
              One calendar. Every club. Automatic reminders delivered to your
              inbox every Monday.
            </p>
            <button className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/20">
              Get Weekly Digest
            </button>
          </div>
        </SonarGrid>
      </section>
    </div>
  );
}