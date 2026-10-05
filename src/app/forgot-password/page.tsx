"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { sendPasswordReset } from "@/lib/supabase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await sendPasswordReset(email);
      setStatus("sent");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn’t send that reset email. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Account recovery</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Reset your password</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">Enter your campus email and we’ll send a secure reset link if an account is available.</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              {status === "sent" && <p role="status" className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">If that email is registered, a reset link is on its way.</p>}
              {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <div><label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-white/70">Campus email</label><input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@campus.edu" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
              <button type="submit" disabled={status === "sending"} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-black transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60">{status === "sending" ? "Sending link…" : "Send reset link"}</button>
            </form>
            <p className="mt-6 text-center text-sm text-white/45">Remembered it? <Link href="/login" className="font-medium text-emerald-400 hover:text-emerald-300">Log in</Link></p>
          </motion.section>
        </main>
      </WebsiteShaderCanvas>
    </div>
  );
}
