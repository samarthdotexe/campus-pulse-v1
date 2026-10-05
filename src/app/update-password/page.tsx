"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { updatePassword } from "@/lib/supabase/auth";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("Your password confirmation does not match.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setError("");
    try {
      await updatePassword(password);
      setStatus("saved");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "We couldn’t update your password. Request a new reset link and try again.");
      setStatus("error");
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Almost there</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Choose a new password</h1>
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {status === "saved" && <p role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">Password updated. You can now log in with your new password.</p>}
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <div><label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-white/70">New password</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
              <div><label htmlFor="new-password-confirmation" className="mb-1.5 block text-sm font-medium text-white/70">Confirm new password</label><input id="new-password-confirmation" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
              <button type="submit" disabled={status === "saving" || status === "saved"} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-black transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60">{status === "saving" ? "Updating password…" : "Update password"}</button>
            </form>
            <p className="mt-6 text-center text-sm text-white/45"><Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">Back to login</Link></p>
          </motion.section>
        </main>
      </WebsiteShaderCanvas>
    </div>
  );
}
