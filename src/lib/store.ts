import { CampusEvent, Club, User, RsvpSubmission, events as seedEvents, clubs as seedClubs } from "./data";

const KEYS = {
  user: "cp_user",
  events: "cp_events",
  rsvps: "cp_rsvps",
  clubs: "cp_clubs",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUser(): User | null {
  return read<User | null>(KEYS.user, null);
}

export function setUser(user: User | null): void {
  write(KEYS.user, user);
}

export function getClubs(): Club[] {
  return read<Club[]>(KEYS.clubs, seedClubs);
}

export function saveClubs(clubs: Club[]): void {
  write(KEYS.clubs, clubs);
}

export function addClub(club: Club): void {
  saveClubs([...getClubs(), club]);
}

export function updateClub(updated: Club): void {
  saveClubs(getClubs().map((club) => club.slug === updated.slug ? updated : club));
}

export function getEvents(): CampusEvent[] {
  return read<CampusEvent[]>(KEYS.events, seedEvents);
}

export function saveEvents(events: CampusEvent[]): void {
  write(KEYS.events, events);
}

export function addEvent(event: CampusEvent): void {
  const all = getEvents();
  all.push(event);
  saveEvents(all);
}

export function updateEvent(updated: CampusEvent): void {
  const all = getEvents().map((e) => (e.id === updated.id ? updated : e));
  saveEvents(all);
}

export function deleteEvent(id: string): void {
  saveEvents(getEvents().filter((e) => e.id !== id));
}

export function getRsvps(): RsvpSubmission[] {
  return read<RsvpSubmission[]>(KEYS.rsvps, []);
}

export function addRsvp(submission: RsvpSubmission): void {
  const all = getRsvps();
  all.push(submission);
  write(KEYS.rsvps, all);
  const events = getEvents();
  const ev = events.find((e) => e.id === submission.eventId);
  if (ev) {
    ev.rsvps += 1;
    saveEvents(events);
  }
}

export function hasUserRsvped(userId: string, eventId: string): boolean {
  return getRsvps().some((r) => r.userId === userId && r.eventId === eventId);
}

export function removeRsvp(userId: string, eventId: string): void {
  const rsvps = getRsvps();
  const removed = rsvps.some((r) => r.userId === userId && r.eventId === eventId);
  if (!removed) return;

  write(KEYS.rsvps, rsvps.filter((r) => r.userId !== userId || r.eventId !== eventId));
  const events = getEvents();
  const event = events.find((item) => item.id === eventId);
  if (event) {
    event.rsvps = Math.max(0, event.rsvps - 1);
    saveEvents(events);
  }
}

export function initStore(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.events)) {
    saveEvents(seedEvents);
  }
}
