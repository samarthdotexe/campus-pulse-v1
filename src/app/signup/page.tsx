"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { useAuth } from "@/components/auth-context";
import { clubs, User, UserRole } from "@/lib/data";
import { motion, AnimatePresence } from "motion/react";

const roles: { value: UserRole; title: string; description: string }[] = [
  { value: "participant", title: "Club Participant", description: "Discover events and RSVP." },
  { value: "committee", title: "Club Member", description: "Create events and build RSVP forms for your club." },
  { value: "admin", title: "Faculty Member / Admin", description: "Manage events across campus." },
];

function getStoredUsers(): User[] {
  try { return JSON.parse(localStorage.getItem("campus_users") || "[]"); } catch { return []; }
}

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [clubSlug, setClubSlug] = useState(clubs[0]?.slug ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    const users = getStoredUsers();
    if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) { setError("An account already exists with that email. Please log in instead."); return; }
    const user: User = { id: crypto.randomUUID(), name: name.trim(), email: email.trim(), role, ...(role === "committee" ? { clubSlug } : {}) };
    localStorage.setItem("campus_users", JSON.stringify([...users, user]));
    login(user);
    router.replace("/signup-success");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }} className="w-full max-w-2xl">
            <h1 className="text-center text-3xl font-bold tracking-tight text-white">Create your account</h1><p className="mt-2 text-center text-sm text-white/50">Choose how you’ll use Campus Pulse.</p>
            <AnimatePresence mode="wait">
              {!role ? <motion.div key="roles" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-8 grid gap-4 sm:grid-cols-3">{roles.map((item) => <motion.button key={item.value} type="button" onClick={() => setRole(item.value)} whileHover={{ scale: 1.03, borderColor: "rgba(16, 185, 129, 0.4)" }} whileTap={{ scale: 0.97 }} className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left backdrop-blur-xl"><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-white/45">{item.description}</p></motion.button>)}</motion.div> :
              <motion.form key="details" onSubmit={handleSubmit} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                <button type="button" onClick={() => { setRole(null); setError(""); }} className="text-xs text-white/45 transition hover:text-white/75">← Change account type</button><p className="text-sm font-medium text-emerald-300">Signing up as {roles.find((item) => item.value === role)?.title}</p>
                {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Name</label><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Campus email</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@campus.edu" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                {role === "committee" && <div><label className="mb-1.5 block text-sm font-medium text-white/70">Your club</label><select value={clubSlug} onChange={(event) => setClubSlug(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50">{clubs.map((club) => <option key={club.slug} value={club.slug} className="bg-black">{club.name}</option>)}</select></div>}
                <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:from-emerald-400 hover:to-teal-400">Create account</motion.button>
              </motion.form>}
            </AnimatePresence>
            <p className="mt-6 text-center text-xs text-white/40">Already have an account? <Link href="/login" className="font-medium text-emerald-400 transition hover:text-emerald-300">Log in</Link></p>
          </motion.div>
        </div>
      </WebsiteShaderCanvas>
    </div>
  );
}
