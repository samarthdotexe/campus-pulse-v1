"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { RsvpQuestion } from "@/lib/data";
import { useCampusData } from "@/components/campus-data-context";
import { X } from "lucide-react";
import { motion } from "motion/react";

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { clubs, createEvent } = useCampusData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [questions, setQuestions] = useState<RsvpQuestion[]>([]);
  const [showQForm, setShowQForm] = useState(false);
  const [qLabel, setQLabel] = useState("");
  const [qType, setQType] = useState<RsvpQuestion["type"]>("text");
  const [qRequired, setQRequired] = useState(false);
  const [qOptions, setQOptions] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role !== "committee" && user.role !== "admin") router.replace("/login");
  }, [user, router]);

  if (!user || (user.role !== "committee" && user.role !== "admin")) return null;

  const clubSlug = user.role === "admin" ? selectedClub || clubs[0]?.slug : user.clubSlug!;
  const club = clubs.find((c) => c.slug === clubSlug);

  const addQuestion = () => {
    if (!qLabel.trim()) return;
    const q: RsvpQuestion = {
      id: `q-${Date.now()}`,
      label: qLabel.trim(),
      type: qType,
      required: qRequired,
      ...(qType === "select" || qType === "radio" ? { options: qOptions.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
    };
    setQuestions([...questions, q]);
    setQLabel(""); setQType("text"); setQRequired(false); setQOptions(""); setShowQForm(false);
  };

  const removeQuestion = (id: string) => setQuestions(questions.filter((q) => q.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubSlug) {
      setError("Create a club before creating an event.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await createEvent({
      title,
      description,
      date,
      time,
      location,
      clubSlug,
      capacity: Number(capacity),
      rsvpQuestions: questions,
      }, user.id);
      router.push("/calendar");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create the event.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:bg-white/[0.07]";
  const labelCls = "block text-sm font-medium text-white/60 mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.12, visualDuration: 0.5 }}
      className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10"
    >
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <div>
          <label className={labelCls}>Title</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} min-h-[100px]`} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={labelCls}>Location</label>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Capacity</label>
            <input type="number" className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" required />
          </div>
          <div>
            <label className={labelCls}>Club</label>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/50">
              {user.role === "admin" ? (
                <select value={clubSlug} onChange={(e) => setSelectedClub(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none">
                  {clubs.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{item.name}</option>)}
                </select>
              ) : (club?.name ?? user.clubSlug)}
            </div>
          </div>
        </div>

        {/* RSVP Questions */}
        <div className="border-t border-white/10 pt-5 mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">RSVP Form Builder</h2>
            <button type="button" onClick={() => setShowQForm(!showQForm)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20">
              Add Question
            </button>
          </div>

          {showQForm && (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <input className={inputCls} placeholder="Question label" value={qLabel} onChange={(e) => setQLabel(e.target.value)} />
              <select className={inputCls} value={qType} onChange={(e) => setQType(e.target.value as RsvpQuestion["type"])}>
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
              {(qType === "select" || qType === "radio") && (
                <input className={inputCls} placeholder="Options (comma-separated)" value={qOptions} onChange={(e) => setQOptions(e.target.value)} />
              )}
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" checked={qRequired} onChange={(e) => setQRequired(e.target.checked)} className="rounded" />
                Required
              </label>
              <button type="button" onClick={addQuestion} className="rounded-lg bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30">
                Save Question
              </button>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <div>
                    <span className="text-sm text-white">{q.label}</span>
                    <span className="ml-2 text-xs text-white/30">{q.type}{q.required ? " *" : ""}</span>
                  </div>
                  <button type="button" onClick={() => removeQuestion(q.id)} className="text-white/30 hover:text-white/60 transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          {submitting ? "Creating event…" : "Create Event"}
        </motion.button>
      </form>
    </motion.div>
  );
}
