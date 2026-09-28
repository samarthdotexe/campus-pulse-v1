"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";
import { getEvents, addRsvp, hasUserRsvped } from "@/lib/store";
import { clubs } from "@/lib/data";

export default function RsvpPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const events = getEvents();
  const event = events.find((e) => e.id === params.id);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRsvped, setAlreadyRsvped] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "participant") {
      router.replace("/login");
      return;
    }
    if (event && hasUserRsvped(user.id, event.id)) {
      setAlreadyRsvped(true);
    }
    setReady(true);
  }, [user, event, router]);

  if (!ready || !event || !user) return null;

  const club = clubs.find((c) => c.slug === event.clubSlug);

  const updateAnswer = (qId: string, value: string | string[]) => {
    setAnswers({ ...answers, [qId]: value });
  };

  const toggleCheckbox = (qId: string, option: string) => {
    const current = (answers[qId] as string[]) || [];
    const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
    updateAnswer(qId, next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRsvp({
      id: `rsvp-${Date.now()}`,
      eventId: event.id,
      userId: user.id,
      answers,
      submittedAt: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  if (alreadyRsvped) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Already RSVPed</h1>
        <p className="mt-2 text-white/50">You have already submitted your RSVP for this event.</p>
        <Link href={`/events/${event.id}`} className="mt-6 inline-block rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20">
          Back to Event
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-emerald-400">RSVP Confirmed!</h1>
        <p className="mt-2 text-white/50">You are registered for {event.title}.</p>
        <Link href={`/events/${event.id}`} className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90">
          Back to Event
        </Link>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:bg-white/[0.07]";
  const labelCls = "block text-sm font-medium text-white/60 mb-1.5";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <span
          className="rounded-lg px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: `${club?.color ?? "#7bd8c4"}15`, color: club?.color ?? "#7bd8c4" }}
        >
          {club?.name ?? "Club"}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-white">{event.title}</h1>
        <p className="mt-1 text-sm text-white/50">{event.date} at {event.time} &middot; {event.location}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {event.rsvpQuestions.length === 0 ? (
          <p className="text-sm text-white/50">No additional questions. Confirm your RSVP below.</p>
        ) : (
          event.rsvpQuestions.map((q) => (
            <div key={q.id}>
              <label className={labelCls}>
                {q.label}{q.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>

              {q.type === "text" && (
                <input
                  type="text"
                  className={inputCls}
                  required={q.required}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  required={q.required}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                />
              )}

              {q.type === "select" && (
                <select
                  className={inputCls}
                  required={q.required}
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {q.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {q.type === "radio" && (
                <div className="space-y-2">
                  {q.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        required={q.required}
                        checked={answers[q.id] === opt}
                        onChange={() => updateAnswer(q.id, opt)}
                        className="accent-emerald-400"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "checkbox" && (
                <div className="space-y-2">
                  {(q.options && q.options.length > 0 ? q.options : ["Yes"]).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={((answers[q.id] as string[]) || []).includes(opt)}
                        onChange={() => toggleCheckbox(q.id, opt)}
                        className="rounded accent-emerald-400"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <button type="submit" className="mt-4 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90">
          Confirm RSVP
        </button>
      </form>
    </div>
  );
}
