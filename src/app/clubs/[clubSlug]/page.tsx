import { notFound } from "next/navigation";
import Link from "next/link";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { clubs, events } from "@/lib/data";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  return clubs.map((club) => ({ clubSlug: club.slug }));
}

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const club = clubs.find((c) => c.slug === clubSlug);

  if (!club) notFound();

  const clubEvents = events
    .filter((e) => e.clubSlug === club.slug)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative min-h-screen">
      {/* Club Hero with aurora-veil background tinted to club color */}
      <section className="relative h-[50vh] w-full">
        <WebsiteShaderCanvas
          preset="aurora-veil"
          tone="dark"
          className="absolute inset-0 h-full w-full"
        >
          <div className="flex h-full flex-col items-start justify-end px-6 pb-12">
            <div className="mx-auto w-full max-w-6xl">
              <Link
                href="/clubs"
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/70"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Clubs
              </Link>

              <div className="flex items-end gap-6">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold shadow-2xl"
                  style={{
                    backgroundColor: `${club.color}20`,
                    color: club.color,
                    boxShadow: `0 8px 32px ${club.color}30`,
                  }}
                >
                  {club.name.charAt(0)}
                </div>
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
              </div>
            </div>
          </div>
        </WebsiteShaderCanvas>
      </section>

      {/* Club Info + Events */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          {/* Sidebar */}
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm leading-relaxed text-white/60">
                {club.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
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

              <button
                className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                style={{ backgroundColor: club.color }}
              >
                Join {club.name}
              </button>
            </div>
          </div>

          {/* Events List */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-white">
              Upcoming Events
            </h2>

            {clubEvents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-4 text-white/40">
                  No upcoming events from {club.name} yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clubEvents.map((event) => {
                  const fillPercent = Math.round(
                    (event.rsvps / event.capacity) * 100
                  );

                  return (
                    <div
                      key={event.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}