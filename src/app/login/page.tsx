"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { clubs, UserRole } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clubSlug, setClubSlug] = useState(clubs[0]?.slug ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name.trim() || !email.trim()) return;
    login({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      role,
      ...(role === "committee" ? { clubSlug } : {}),
    });
    router.push("/");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <WebsiteShaderCanvas
        preset="aurora-veil"
        tone="dark"
        className="absolute inset-0 h-full w-full"
      >
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-lg">
            <h1 className="text-center text-3xl font-bold tracking-tight text-white">
              Welcome to Campus Pulse
            </h1>
            <p className="mt-2 text-center text-sm text-white/50">Select your role to continue</p>

            {!role ? (
              <div className="mt-8 grid w-full gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setRole("participant")}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-white/[0.06]"
                >
                  <h2 className="font-semibold text-white transition-colors group-hover:text-emerald-300">
                    Club Participant
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    Browse events and RSVP
                  </p>
                </button>
                <button
                  onClick={() => setRole("committee")}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:bg-white/[0.06]"
                >
                  <h2 className="font-semibold text-white transition-colors group-hover:text-emerald-300">
                    Committee Member
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    Manage a club and create events
                  </p>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  &larr; Change role
                </button>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/70">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    placeholder="you@campus.edu"
                  />
                </div>

                {role === "committee" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/70">Club</label>
                    <select
                      value={clubSlug}
                      onChange={(e) => setClubSlug(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    >
                      {clubs.map((c) => (
                        <option key={c.slug} value={c.slug} className="bg-black text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:from-emerald-400 hover:to-teal-400"
                >
                  Continue as {role === "participant" ? "Participant" : "Committee"}
                </button>
              </form>
            )}
          </div>
        </div>
      </WebsiteShaderCanvas>
    </div>
  );
}