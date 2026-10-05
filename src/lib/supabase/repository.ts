import type { CampusEvent, Club, RsvpQuestion, RsvpSubmission, User, UserRole } from "@/lib/data";
import { createClient } from "./client";

type JsonValue = string | boolean | string[];

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  location: string;
  capacity: number;
  cover_image_url?: string | null;
  created_by: string;
  rsvp_count?: number | null;
  clubs: { slug: string } | { slug: string }[] | null;
  rsvp_questions?: QuestionRecord[] | null;
};

type QuestionRecord = {
  id: string;
  label: string;
  type: RsvpQuestion["type"];
  required: boolean;
  options: unknown;
  position: number;
};

type ClubRecord = {
  slug: string;
  name: string;
  username: string | null;
  tagline: string;
  description: string;
  category: string;
  member_count: number;
  color: string;
  logo_url: string | null;
};

type ProfileRecord = {
  id: string;
  name: string;
  username: string | null;
  role: UserRole;
  club_slug: string | null;
  avatar_path: string | null;
};

export type EventInput = Omit<CampusEvent, "id" | "rsvps" | "createdBy">;
export type ClubInput = Club;
export type OrganizerRsvp = RsvpSubmission & { participantName: string };
export type AccessAccount = {
  id: string; name: string; username: string | null; email: string; role: UserRole; clubSlug: string | null;
  canCreateEvents: boolean; canEditEvents: boolean; canManageRsvps: boolean; canEditClub: boolean; isOwner: boolean;
};

export function mapAccessAccount(row: Record<string, unknown>): AccessAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    username: row.username as string | null,
    email: row.email as string,
    role: row.role as UserRole,
    clubSlug: row.club_slug as string | null,
    canCreateEvents: Boolean(row.can_create_events),
    canEditEvents: Boolean(row.can_edit_events),
    canManageRsvps: Boolean(row.can_manage_rsvps),
    canEditClub: Boolean(row.can_edit_club),
    isOwner: Boolean(row.is_owner),
  };
}
type OrganizerRsvpRecord = {
  id: string;
  event_id: string;
  user_id: string;
  participant_name: string;
  answers: unknown;
  created_at: string;
};
type RsvpRecord = Omit<OrganizerRsvpRecord, "participant_name">;

function getOneClub(relation: EventRecord["clubs"]): { slug: string } | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatLocalTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(value);
}

function toOptions(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((option) => typeof option === "string")) return undefined;
  return value;
}

function mapQuestion(record: QuestionRecord): RsvpQuestion {
  return {
    id: record.id,
    label: record.label,
    type: record.type,
    required: record.required,
    ...(toOptions(record.options) ? { options: toOptions(record.options) } : {}),
  };
}

export function mapEventRecord(record: EventRecord): CampusEvent {
  const club = getOneClub(record.clubs);
  if (!club?.slug) throw new Error("This event is missing its club relationship.");

  const startsAt = new Date(record.starts_at);
  if (Number.isNaN(startsAt.getTime())) throw new Error("This event has an invalid start time.");

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    date: formatLocalDate(startsAt),
    time: formatLocalTime(startsAt),
    location: record.location,
    clubSlug: club.slug,
    rsvps: record.rsvp_count ?? 0,
    capacity: record.capacity,
    ...(record.cover_image_url ? { coverImage: record.cover_image_url } : {}),
    createdBy: record.created_by,
    rsvpQuestions: (record.rsvp_questions ?? []).sort((a, b) => a.position - b.position).map(mapQuestion),
  };
}

function mapClubRecord(record: ClubRecord): Club {
  return {
    slug: record.slug,
    name: record.name,
    ...(record.username ? { username: record.username } : {}),
    tagline: record.tagline,
    description: record.description,
    category: record.category,
    memberCount: record.member_count,
    color: record.color,
    ...(record.logo_url ? { logo: record.logo_url } : {}),
  };
}

export function mapProfileRecord(record: ProfileRecord, email: string): User {
  return {
    id: record.id,
    name: record.name,
    email,
    role: record.role,
    ...(record.username ? { username: record.username } : {}),
    ...(record.club_slug ? { clubSlug: record.club_slug } : {}),
    ...(record.avatar_path ? { avatarPath: record.avatar_path } : {}),
  };
}

function createStartsAt(date: string, time: string): string {
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Choose a valid event date and time.");
  return parsed.toISOString();
}

function questionInsertRows(eventId: string, questions: RsvpQuestion[]) {
  return questions.map((question, position) => ({
    event_id: eventId,
    label: question.label,
    type: question.type,
    required: question.required,
    options: question.options ?? [],
    position,
  }));
}

function databaseError(error: { message: string; code?: string } | null): never {
  if (!error) throw new Error("Supabase did not return data for this request.");
  if (error.code === "42703") throw new Error("Your Supabase database needs the shared-event migration applied before this page can load.");
  if (error.code === "42883" && error.message.includes("access")) throw new Error("Your Supabase database needs the Club Member permissions migration applied before this page can load.");
  throw new Error(error.message);
}

export async function listClubs(): Promise<Club[]> {
  const { data, error } = await createClient().from("clubs").select("slug, name, tagline, description, category, member_count, color, logo_url").order("name");
  if (error) databaseError(error);
  return (data as ClubRecord[]).map(mapClubRecord);
}

export async function listEvents(): Promise<CampusEvent[]> {
  const { data, error } = await createClient()
    .from("events")
    .select("id, title, description, starts_at, location, capacity, cover_image_url, created_by, rsvp_count, clubs(slug), rsvp_questions(id, label, type, required, options, position)")
    .order("starts_at");
  if (error) databaseError(error);
  return (data as unknown as EventRecord[]).map(mapEventRecord);
}

export async function getCurrentProfile(id: string, email: string): Promise<User | null> {
  const { data, error } = await createClient().from("profiles").select("id, name, username, role, club_slug, avatar_path").eq("id", id).maybeSingle();
  if (error) databaseError(error);
  return data ? mapProfileRecord(data as ProfileRecord, email) : null;
}

export async function listAccessAccounts(): Promise<AccessAccount[]> {
  const { data, error } = await createClient().rpc("list_access_accounts");
  if (error) databaseError(error);
  return ((data ?? []) as Array<Record<string, unknown>>).map(mapAccessAccount);
}

export async function saveClubMemberAccess(account: AccessAccount, clubSlug: string, permissions: Pick<AccessAccount, "canCreateEvents" | "canEditEvents" | "canManageRsvps" | "canEditClub">): Promise<void> {
  const { error } = await createClient().rpc("save_club_member_access", {
    p_user_id: account.id, p_club_slug: clubSlug, p_can_create_events: permissions.canCreateEvents,
    p_can_edit_events: permissions.canEditEvents, p_can_manage_rsvps: permissions.canManageRsvps, p_can_edit_club: permissions.canEditClub,
  });
  if (error) databaseError(error);
}

export async function removeClubMember(userId: string): Promise<void> {
  const { error } = await createClient().rpc("remove_club_member", { p_user_id: userId });
  if (error) databaseError(error);
}

export async function setFacultyAdminRole(userId: string, makeAdmin: boolean): Promise<void> {
  const { error } = await createClient().rpc("set_faculty_admin_role", { p_user_id: userId, p_make_admin: makeAdmin });
  if (error) databaseError(error);
}

export async function listMyRsvps(userId: string): Promise<RsvpSubmission[]> {
  const { data, error } = await createClient().from("rsvps").select("id, event_id, user_id, answers, created_at").eq("user_id", userId);
  if (error) databaseError(error);
  return ((data ?? []) as RsvpRecord[]).map((record) => ({
    id: record.id,
    eventId: record.event_id,
    userId: record.user_id,
    answers: (record.answers ?? {}) as Record<string, JsonValue>,
    submittedAt: record.created_at,
  }));
}

export async function listOrganizerRsvps(): Promise<OrganizerRsvp[]> {
  const { data, error } = await createClient().rpc("get_organizer_rsvps");
  if (error) databaseError(error);
  return ((data ?? []) as OrganizerRsvpRecord[]).map((record) => ({
    id: record.id,
    eventId: record.event_id,
    userId: record.user_id,
    participantName: record.participant_name,
    answers: (record.answers ?? {}) as Record<string, JsonValue>,
    submittedAt: record.created_at,
  }));
}

export async function createEvent(input: EventInput, userId: string): Promise<void> {
  const client = createClient();
  const { data: club, error: clubError } = await client.from("clubs").select("id").eq("slug", input.clubSlug).single();
  if (clubError) databaseError(clubError);

  const { data: event, error } = await client.from("events").insert({
    club_id: club.id,
    created_by: userId,
    title: input.title,
    description: input.description,
    starts_at: createStartsAt(input.date, input.time),
    location: input.location,
    capacity: input.capacity,
    cover_image_url: input.coverImage ?? null,
  }).select("id").single();
  if (error) databaseError(error);

  if (input.rsvpQuestions.length) {
    const { error: questionError } = await client.from("rsvp_questions").insert(questionInsertRows(event.id, input.rsvpQuestions));
    if (questionError) databaseError(questionError);
  }
}

export async function updateEvent(eventId: string, input: EventInput): Promise<void> {
  const client = createClient();
  const { error } = await client.from("events").update({
    title: input.title,
    description: input.description,
    starts_at: createStartsAt(input.date, input.time),
    location: input.location,
    capacity: input.capacity,
    cover_image_url: input.coverImage ?? null,
  }).eq("id", eventId);
  if (error) databaseError(error);

  const { error: clearError } = await client.from("rsvp_questions").delete().eq("event_id", eventId);
  if (clearError) databaseError(clearError);
  if (input.rsvpQuestions.length) {
    const { error: questionError } = await client.from("rsvp_questions").insert(questionInsertRows(eventId, input.rsvpQuestions));
    if (questionError) databaseError(questionError);
  }
}

export async function createRsvp(eventId: string, userId: string, answers: Record<string, JsonValue>): Promise<void> {
  const { error } = await createClient().from("rsvps").insert({ event_id: eventId, user_id: userId, answers });
  if (error) databaseError(error);
}

export async function cancelRsvp(eventId: string, userId: string): Promise<void> {
  const { error } = await createClient().from("rsvps").delete().eq("event_id", eventId).eq("user_id", userId);
  if (error) databaseError(error);
}

export async function createClub(input: ClubInput): Promise<void> {
  const { error } = await createClient().from("clubs").insert({
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    member_count: input.memberCount,
    color: input.color,
    logo_url: input.logo ?? null,
  });
  if (error) databaseError(error);
}

export async function updateClub(slug: string, input: ClubInput): Promise<void> {
  const { error } = await createClient().from("clubs").update({
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    category: input.category,
    member_count: input.memberCount,
    color: input.color,
    logo_url: input.logo ?? null,
  }).eq("slug", slug);
  if (error) databaseError(error);
}
