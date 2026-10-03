"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { addClub, getClubs, updateClub } from "@/lib/store";
import { Club } from "@/lib/data";
import { motion } from "motion/react";
import { ArrowLeft, Plus, Save } from "lucide-react";

const emptyClub: Club = { slug: "", name: "", tagline: "", description: "", category: "Campus", memberCount: 0, color: "#1de9b6", logo: "" };

export default function ManageClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState(getClubs());
  const [editing, setEditing] = useState<Club | null>(null);
  const [draft, setDraft] = useState<Club>(emptyClub);
  const [message, setMessage] = useState("");

  if (!user || user.role !== "admin") return <div className="mx-auto max-w-2xl px-6 py-24 text-center"><h1 className="text-2xl font-bold text-white">Admin access required</h1><p className="mt-2 text-white/50">Sign in as a Faculty Member / Admin to manage clubs.</p><Link href="/login" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black">Log in</Link></div>;

  const setField = (key: keyof Club, value: string | number) => setDraft((current) => ({ ...current, [key]: value }));
  const startNew = () => { setEditing(null); setDraft(emptyClub); setMessage(""); };
  const startEdit = (club: Club) => { setEditing(club); setDraft({ ...club }); setMessage(""); };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const slug = editing?.slug ?? draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const saved = { ...draft, slug, name: draft.name.trim(), logo: draft.logo?.trim() || undefined };
    if (editing) updateClub(saved); else addClub(saved);
    const updated = getClubs();
    setClubs(updated);
    setEditing(saved);
    setDraft(saved);
    setMessage(editing ? "Club details saved." : "Club added to the directory.");
  };
  const input = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-emerald-400/50";
  const label = "mb-1.5 block text-sm font-medium text-white/60";

  return <div className="mx-auto max-w-6xl px-6 py-10">
    <Link href="/clubs" className="mb-5 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"><ArrowLeft className="h-4 w-4"/> Clubs</Link>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Campus administration</p><h1 className="mt-2 text-3xl font-bold text-white">Manage Clubs</h1><p className="mt-2 text-sm text-white/45">Add clubs and update their directory details, branding, and descriptions.</p></div><button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-4 py-2.5 text-sm font-semibold text-black"><Plus className="h-4 w-4"/> Add club</button></div>
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-3">{clubs.map((club) => <button key={club.slug} onClick={() => startEdit(club)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${editing?.slug === club.slug ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}>
        {club.logo ? <img src={club.logo} alt="" className="h-12 w-12 rounded-xl object-cover"/> : <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold" style={{ color: club.color, backgroundColor: `${club.color}20` }}>{club.name.charAt(0)}</span>}
        <span className="min-w-0"><span className="block truncate font-semibold text-white">{club.name}</span><span className="mt-0.5 block truncate text-xs text-white/40">{club.tagline}</span></span><span className="ml-auto text-xs text-white/30">Edit</span>
      </button>)}</div>
      <motion.form key={editing?.slug ?? "new"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={save} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">{editing ? `Edit ${editing.name}` : "New club details"}</h2>
        <div><label className={label}>Club name</label><input required value={draft.name} onChange={(e) => setField("name", e.target.value)} className={input} placeholder="e.g. Photography Club"/></div>
        <div><label className={label}>Club tagline</label><input required value={draft.tagline} onChange={(e) => setField("tagline", e.target.value)} className={input} placeholder="A short line that captures the club"/></div>
        <div><label className={label}>Description</label><textarea required rows={4} value={draft.description} onChange={(e) => setField("description", e.target.value)} className={input} placeholder="What does the club do?"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className={label}>Category</label><input required value={draft.category} onChange={(e) => setField("category", e.target.value)} className={input}/></div><div><label className={label}>Member count</label><input type="number" min="0" value={draft.memberCount} onChange={(e) => setField("memberCount", Number(e.target.value))} className={input}/></div></div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]"><div><label className={label}>Logo image URL</label><input type="url" value={draft.logo ?? ""} onChange={(e) => setField("logo", e.target.value)} className={input} placeholder="https://…"/></div><div><label className={label}>Club color</label><input type="color" value={draft.color} onChange={(e) => setField("color", e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 p-1 sm:w-16"/></div></div>
        {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
        <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90"><Save className="h-4 w-4"/> {editing ? "Save club changes" : "Create club"}</button>
      </motion.form>
    </div>
  </div>;
}
