"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { useAuth } from "@/components/auth-context";
import { type Club, UserRole } from "@/lib/data";
import { listClubs } from "@/lib/supabase/repository";
import { motion, AnimatePresence } from "motion/react";

const roles: { value: UserRole; title: string; description: string }[] = [
  { value: "participant", title: "Club Participant", description: "Discover events and RSVP." },
  { value: "committee", title: "Club Member", description: "Create events and build RSVP forms for your club." },
  { value: "admin", title: "Faculty Member / Admin", description: "Manage events across campus." },
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clubOptions, setClubOptions] = useState<Club[]>([]);
  const [clubSlug, setClubSlug] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void listClubs().then((nextClubs) => {
      setClubOptions(nextClubs);
      setClubSlug((current) => current || nextClubs[0]?.slug || "");
    }).catch(() => setError("We couldn’t load clubs right now. Try again in a moment."));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await signUp({ name, email, password, confirmPassword, requestedRole: role, requestedClubSlug: clubSlug });
      const params = new URLSearchParams();
      if (result.requiresEmailConfirmation) params.set("confirm", "email");
      if (role !== "participant") params.set("pending", "role");
      router.replace(`/signup-success${params.size ? `?${params.toString()}` : ""}`);
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }} className="w-full max-w-2xl">
            <h1 className="text-center text-3xl font-bold tracking-tight text-white">Create your account</h1><p className="mt-2 text-center text-sm text-white/50">Choose how you’ll use Campus Pulse.</p>
            <AnimatePresence mode="wait">
              {!role ? <motion.div key="roles" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-8 grid gap-4 sm:grid-cols-3">{roles.map((item) => <motion.button key={item.value} type="button" onClick={() => setRole(item.value)} whileHover={{ scale: 1.03, borderColor: "rgba(16, 185, 129, 0.4)" }} whileTap={{ scale: 0.97 }} className="rounded-2xl border border-white/10 bg-black/40 p-5 text-left backdrop-blur-xl"><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-white/45">{item.description}</p></motion.button>)}</motion.div> :
              <motion.form key="details" onSubmit={handleSubmit} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl sm:p-6">
                <button type="button" onClick={() => { setRole(null); setError(""); }} className="text-xs text-white/45 transition hover:text-white/75">← Change account type</button><p className="text-sm font-medium text-emerald-300">Signing up as {roles.find((item) => item.value === role)?.title}</p>
                {role !== "participant" && <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-100/80">Your account will start as a participant. A Campus Pulse admin assigns Club Member or Faculty Member / Admin access after verification.</p>}
                {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Name</label><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Campus email</label><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@campus.edu" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                {role === "committee" && <div><label className="mb-1.5 block text-sm font-medium text-white/70">Club you want to represent</label><select required value={clubSlug} onChange={(event) => setClubSlug(event.target.value)} disabled={!clubOptions.length} className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60"><option value="" className="bg-black">{clubOptions.length ? "Choose a club" : "No clubs available"}</option>{clubOptions.map((club) => <option key={club.slug} value={club.slug} className="bg-black">{club.name}</option>)}</select></div>}
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Password</label><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-white/70">Confirm password</label><input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Creating account…" : "Create account"}</motion.button>
              </motion.form>}
            </AnimatePresence>
            <p className="mt-6 text-center text-xs text-white/40">Already have an account? <Link href="/login" className="font-medium text-emerald-400 transition hover:text-emerald-300">Log in</Link></p>
          </motion.div>
        </div>
      </WebsiteShaderCanvas>
    </div>
  );
}
