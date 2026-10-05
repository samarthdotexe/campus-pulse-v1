"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, SlidersHorizontal, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useCampusData } from "@/components/campus-data-context";
import { WebsiteShaderCanvas } from "@/components/ui/shader-aurora-veil";
import {
  listAccessAccounts,
  removeClubMember,
  saveClubMemberAccess,
  setFacultyAdminRole,
  type AccessAccount,
} from "@/lib/supabase/repository";

type PermissionKey = "canCreateEvents" | "canEditEvents" | "canManageRsvps" | "canEditClub";

const permissionLabels: Record<PermissionKey, string> = {
  canCreateEvents: "Create events",
  canEditEvents: "Edit events",
  canManageRsvps: "Manage RSVPs",
  canEditClub: "Edit club details",
};

function roleLabel(role: AccessAccount["role"]) {
  return role === "admin" ? "Faculty / Admin" : role === "committee" ? "Club Member" : "Participant";
}

export default function AccessManagementPage() {
  const { user, loading, canApproveRoleRequests } = useAuth();
  const { clubs } = useCampusData();
  const [accounts, setAccounts] = useState<AccessAccount[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | AccessAccount["role"]>("all");
  const [editing, setEditing] = useState<AccessAccount | null>(null);
  const [clubSlug, setClubSlug] = useState("");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    canCreateEvents: false,
    canEditEvents: false,
    canManageRsvps: false,
    canEditClub: false,
  });
  const [pendingAction, setPendingAction] = useState<{ account: AccessAccount; type: "remove" | "promote" | "demote" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAccounts = useCallback(async () => {
    setError("");
    try {
      setAccounts(await listAccessAccounts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load account access.");
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const loadTimer = window.setTimeout(() => void loadAccounts(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadAccounts, user?.role]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesRole = role === "all" || account.role === role;
      const matchesQuery = !normalizedQuery || [account.name, account.username ?? "", account.email, account.clubSlug ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesRole && matchesQuery;
    });
  }, [accounts, query, role]);

  const beginEdit = (account: AccessAccount) => {
    setNotice("");
    setError("");
    setEditing(account);
    setClubSlug(account.clubSlug ?? clubs[0]?.slug ?? "");
    setPermissions({
      canCreateEvents: account.canCreateEvents,
      canEditEvents: account.canEditEvents,
      canManageRsvps: account.canManageRsvps,
      canEditClub: account.canEditClub,
    });
  };

  const saveAccess = async () => {
    if (!editing || !clubSlug) {
      setError("Choose a club before granting Club Member access.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await saveClubMemberAccess(editing, clubSlug, permissions);
      await loadAccounts();
      setEditing(null);
      setNotice(`${editing.name}'s club access was updated.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update club access.");
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    setError("");
    try {
      if (pendingAction.type === "remove") await removeClubMember(pendingAction.account.id);
      else await setFacultyAdminRole(pendingAction.account.id, pendingAction.type === "promote");
      await loadAccounts();
      setNotice(
        pendingAction.type === "remove"
          ? `${pendingAction.account.name} was removed from club membership.`
          : `${pendingAction.account.name} is now ${pendingAction.type === "promote" ? "a Faculty Member / Admin" : "a Club Participant"}.`,
      );
      setPendingAction(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update this account.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/50">Loading account access…</div>;

  if (user?.role !== "admin") return <div className="min-h-[calc(100dvh-4rem)] bg-black px-4 pt-24 text-center text-sm text-white/60">Faculty Member / Admin access is required for this page.</div>;

  return (
    <WebsiteShaderCanvas preset="aurora-veil" tone="dark" className="min-h-[calc(100dvh-4rem)] w-full">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Administration</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h1 className="text-3xl font-bold tracking-tight text-white">Manage club access</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">Assign Club Members to a club, give only the permissions they need, or remove access when needed.</p></div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> {canApproveRoleRequests ? "Primary owner controls Faculty / Admin roles" : "Faculty / Admin"}</span>
          </div>

          {notice && <p role="status" className="mt-6 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</p>}
          {error && <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="account-search">Search accounts</label>
            <input id="account-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, username, email, or club" className="min-h-11 flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-500/50" />
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/75"><SlidersHorizontal className="h-4 w-4" /><span className="sr-only">Filter by account type</span><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="bg-transparent outline-none"><option className="bg-zinc-950" value="all">All roles</option><option className="bg-zinc-950" value="participant">Participants</option><option className="bg-zinc-950" value="committee">Club Members</option><option className="bg-zinc-950" value="admin">Faculty / Admins</option></select></label>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium uppercase tracking-wide text-white/40"><span>Account</span><span>{filteredAccounts.length} shown</span></div>
            <div className="divide-y divide-white/10">
              {filteredAccounts.map((account) => <article key={account.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{account.name}</h2>{account.isOwner && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-200">Primary owner</span>}<span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/55">{roleLabel(account.role)}</span></div><p className="mt-1 truncate text-sm text-white/50">{account.username ? `@${account.username} · ` : ""}{account.email}</p><p className="mt-2 text-xs text-white/40">{account.clubSlug ? `Club: ${clubs.find((club) => club.slug === account.clubSlug)?.name ?? account.clubSlug}` : "No club assigned"}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {account.role !== "admin" && <button type="button" onClick={() => beginEdit(account)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 text-sm font-medium text-emerald-100 hover:bg-emerald-400/15"><UsersRound className="h-4 w-4" />Manage club access</button>}
                    {account.role === "committee" && <button type="button" onClick={() => setPendingAction({ account, type: "remove" })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-400/25 px-3 text-sm font-medium text-red-200 hover:bg-red-500/10"><UserMinus className="h-4 w-4" />Remove member</button>}
                    {canApproveRoleRequests && !account.isOwner && <button type="button" onClick={() => setPendingAction({ account, type: account.role === "admin" ? "demote" : "promote" })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"><UserPlus className="h-4 w-4" />{account.role === "admin" ? "Remove admin" : "Make admin"}</button>}
                  </div>
                </div>
              </article>)}
              {!filteredAccounts.length && <p className="px-4 py-10 text-center text-sm text-white/45">No accounts match this filter.</p>}
            </div>
          </div>
        </section>
      </main>

      {editing && <div role="dialog" aria-modal="true" aria-labelledby="member-access-title" className="fixed inset-0 z-[70] flex items-end bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:justify-center"><div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:p-6"><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Club Member access</p><h2 id="member-access-title" className="mt-2 text-xl font-bold text-white">{editing.name}</h2><p className="mt-1 text-sm text-white/50">Choose their club and the responsibilities they can perform.</p><label className="mt-6 block text-sm font-medium text-white/70">Specific club<select value={clubSlug} onChange={(event) => setClubSlug(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-emerald-500/50"><option value="" className="bg-zinc-950">Choose a club</option>{clubs.map((club) => <option key={club.slug} value={club.slug} className="bg-zinc-950">{club.name}</option>)}</select></label><div className="mt-5 grid gap-3 sm:grid-cols-2">{(Object.keys(permissionLabels) as PermissionKey[]).map((key) => <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white/75"><input type="checkbox" checked={permissions[key]} onChange={(event) => setPermissions((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 accent-emerald-400" />{permissionLabels[key]}</label>)}</div><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={() => setEditing(null)} className="min-h-11 rounded-lg px-4 text-sm font-medium text-white/65 hover:bg-white/10">Cancel</button><button type="button" disabled={busy} onClick={() => void saveAccess()} className="min-h-11 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60">{busy ? "Saving…" : "Save access"}</button></div></div></div>}

      {pendingAction && <div role="dialog" aria-modal="true" aria-labelledby="confirm-access-title" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"><h2 id="confirm-access-title" className="text-lg font-bold text-white">Confirm account change</h2><p className="mt-3 text-sm leading-relaxed text-white/60">{pendingAction.type === "remove" ? `Remove ${pendingAction.account.name} from their club and revoke all Club Member permissions?` : `${pendingAction.type === "promote" ? "Grant" : "Remove"} Faculty Member / Admin access for ${pendingAction.account.name}?`}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={() => setPendingAction(null)} className="min-h-11 rounded-lg px-4 text-sm font-medium text-white/65 hover:bg-white/10">Cancel</button><button type="button" disabled={busy} onClick={() => void confirmAction()} className="min-h-11 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60">{busy ? "Updating…" : "Confirm change"}</button></div></div></div>}
    </WebsiteShaderCanvas>
  );
}
