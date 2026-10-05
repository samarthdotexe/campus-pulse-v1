"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, Mail, ShieldCheck, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/components/auth-context";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { getAvatarUrl, getMyRoleRequest, updateProfile, uploadAvatar, type RoleRequest } from "@/lib/supabase/auth";

const roleLabel = { participant: "Club Participant", committee: "Club Member", admin: "Faculty Member / Admin" } as const;

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [roleRequest, setRoleRequest] = useState<RoleRequest | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const nameFrame = requestAnimationFrame(() => setName(user.name));
    void getMyRoleRequest().then(setRoleRequest).catch(() => setRoleRequest(null));
    if (user.avatarPath) void getAvatarUrl(user.avatarPath).then(setAvatarUrl).catch(() => setAvatarUrl(null));
    return () => cancelAnimationFrame(nameFrame);
  }, [user]);

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setStatus("saving");
    setError("");
    try {
      const avatarPath = await uploadAvatar(file, user.id);
      const updated = await updateProfile(name, avatarPath);
      setAvatarUrl(await getAvatarUrl(updated.avatarPath ?? avatarPath));
      setStatus("saved");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We couldn’t update your photo.");
      setStatus("error");
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setStatus("saving");
    setError("");
    try {
      const updated = await updateProfile(name, user.avatarPath ?? null);
      setName(updated.name);
      setStatus("saved");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn’t save your profile.");
      setStatus("error");
    }
  };

  if (loading) return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/50">Loading your account…</div>;

  if (!user) {
    return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/60">Please <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">log in</Link> to manage your account.</div>;
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Your account</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Make Campus Pulse yours</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">Update how fellow campus members see you, or check the account details currently in use.</p>

            <section className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 text-2xl font-semibold text-emerald-200">{avatarUrl ? <img src={avatarUrl} alt="Your profile" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><h2 className="font-semibold text-white">Profile photo</h2><p className="mt-1 text-sm text-white/50">PNG, JPG, or WebP up to 2 MB.</p></div>
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/15"><Camera className="h-4 w-4" /> Change photo<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handlePhoto} /></label>
            </section>

            <form onSubmit={handleSave} className="mt-8 space-y-5">
              {status === "saved" && <p role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Profile saved.</p>}
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <div><label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-white/70">Display name</label><input id="display-name" required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
              <button type="submit" disabled={status === "saving"} className="min-h-11 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-black hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60">{status === "saving" ? "Saving…" : "Save profile"}</button>
            </form>

            <section className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><Mail className="h-4 w-4 text-emerald-300" /><p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/40">Signed-in email</p><p className="mt-1 overflow-wrap-anywhere text-sm text-white/80">{user.email}</p></div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><UserRound className="h-4 w-4 text-emerald-300" /><p className="mt-3 text-xs font-medium uppercase tracking-wide text-white/40">Account type</p><p className="mt-1 text-sm text-white/80">{roleLabel[user.role]}</p></div>
            </section>

            {roleRequest && <section className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><ShieldCheck className="h-4 w-4 text-amber-200" /><p className="mt-3 text-sm font-medium text-amber-100">Your {roleLabel[roleRequest.requestedRole]} request is pending approval.</p><p className="mt-1 text-sm text-amber-100/60">You can keep using Campus Pulse as a Club Participant in the meantime.</p></section>}

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><Link href="/forgot-password" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">Reset password</Link><button type="button" onClick={() => void logout()} className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10">Log out</button></div>
          </motion.div>
        </main>
      </WebsiteShaderCanvas>
    </div>
  );
}
