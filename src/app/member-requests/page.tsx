"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck, X } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/components/auth-context";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import { decideRoleRequest, listPendingRoleRequests, type PendingRoleRequest } from "@/lib/supabase/auth";

const roleLabel = { committee: "Club Member", admin: "Faculty Member / Admin" } as const;

export default function MemberRequestsPage() {
  const { loading, canApproveRoleRequests } = useAuth();
  const [requests, setRequests] = useState<PendingRoleRequest[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!canApproveRoleRequests) return;
    void listPendingRoleRequests().then(setRequests).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "We couldn’t load membership requests."));
  }, [canApproveRoleRequests]);

  const decide = async (requestId: string, decision: "approved" | "rejected") => {
    setBusyId(requestId);
    setError("");
    try {
      await decideRoleRequest(requestId, decision);
      setRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "We couldn’t update that request.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/50">Loading permissions…</div>;
  if (!canApproveRoleRequests) return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/60">This page is available only to the Campus Pulse approval team. <Link href="/" className="font-medium text-emerald-400">Back home</Link></div>;

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="absolute inset-0 h-full w-full">
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Approval desk</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Member requests</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">Approve organizer access only after you’ve verified the request with your team.</p></div><div className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100"><ShieldCheck className="h-4 w-4" /> {requests.length} pending</div></div>
            {error && <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            <div className="mt-8 space-y-3">
              {requests.map((request) => <article key={request.id} className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-white">{request.requesterName}</p><p className="mt-1 overflow-wrap-anywhere text-sm text-white/55">{request.requesterEmail}</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-medium text-emerald-200">{roleLabel[request.requestedRole]}</span>{request.requestedClubSlug && <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/65">{request.requestedClubSlug}</span>}<span className="rounded-full bg-white/5 px-2.5 py-1 text-white/45">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(request.createdAt))}</span></div></div><div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" disabled={busyId === request.id} onClick={() => void decide(request.id, "rejected")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-400/25 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/10 disabled:opacity-60"><X className="h-4 w-4" /> Reject</button><button type="button" disabled={busyId === request.id} onClick={() => void decide(request.id, "approved")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-black hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60"><Check className="h-4 w-4" /> Approve</button></div></div></article>)}
              {!requests.length && <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 px-5 py-12 text-center text-sm text-white/55">No membership requests are waiting for review.</div>}
            </div>
          </motion.div>
        </main>
      </WebsiteShaderCanvas>
    </div>
  );
}
