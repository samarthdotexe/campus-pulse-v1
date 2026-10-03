"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { User } from "@/lib/data";
import { motion } from "motion/react";

function getStoredUsers(): User[] {
  try { return JSON.parse(localStorage.getItem("campus_users") || "[]"); } catch { return []; }
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const user = getStoredUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) { setError("We couldn’t find an account with that email. Sign up to join Campus Pulse."); return; }
    login(user);
    router.replace("/returning-user");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }} className="w-full max-w-lg">
            <h1 className="text-center text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-center text-sm text-white/50">Enter your campus email to pick up where you left off.</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
              {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
              <div><label className="mb-1.5 block text-sm font-medium text-white/70">Campus email</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@campus.edu" className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50" /></div>
              <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:from-emerald-400 hover:to-teal-400">Log in</motion.button>
              <p className="text-center text-xs text-white/40">New here? <Link href="/signup" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">Create an account</Link></p>
            </form>
          </motion.div>
        </div>
      </WebsiteShaderCanvas>
    </div>
  );
}
