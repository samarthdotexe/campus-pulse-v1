import { createClient } from "./client";
import type { User, UserRole } from "@/lib/data";

export type ProfileRecord = {
  id: string;
  name: string;
  username: string | null;
  role: UserRole;
  club_slug: string | null;
  avatar_path: string | null;
};

export type RoleRequestStatus = "pending" | "approved" | "rejected";

export type RoleRequest = {
  id: string;
  userId: string;
  requestedRole: Exclude<UserRole, "participant">;
  requestedClubSlug: string | null;
  status: RoleRequestStatus;
  createdAt: string;
};

export type PendingRoleRequest = RoleRequest & {
  requesterName: string;
  requesterEmail: string;
};

export type CampusUser = User;

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  requestedRole: UserRole;
  requestedClubSlug?: string;
};

export function mapProfileToCampusUser(profile: ProfileRecord, email: string): CampusUser {
  return {
    id: profile.id,
    name: profile.name,
    ...(profile.username ? { username: profile.username } : {}),
    email,
    role: profile.role,
    ...(profile.club_slug ? { clubSlug: profile.club_slug } : {}),
    ...(profile.avatar_path ? { avatarPath: profile.avatar_path } : {}),
  };
}

export function validateSignUpInput(input: SignUpInput): string | null {
  if (!input.name.trim()) return "Enter your name to create an account.";
  if (!/^[a-z0-9_]{3,30}$/.test(input.username.trim())) return "Use 3–30 lowercase letters, numbers, or underscores for your username.";
  if (!input.email.trim()) return "Enter your campus email to continue.";
  if (input.password.length < 8) return "Use a password with at least 8 characters.";
  if (input.password !== input.confirmPassword) return "Your password confirmation does not match.";
  if (input.requestedRole === "committee" && !input.requestedClubSlug?.trim()) return "Choose the club you want to represent.";
  return null;
}

export async function signUpWithPassword(input: SignUpInput): Promise<{ requiresEmailConfirmation: boolean }> {
  const validationError = validateSignUpInput(input);
  if (validationError) throw new Error(validationError);

  const { data, error } = await createClient().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        requested_role: input.requestedRole,
        ...(input.requestedRole === "committee" ? { requested_club_slug: input.requestedClubSlug?.trim() } : {}),
      },
    },
  });
  if (error) throw new Error(error.message);
  return { requiresEmailConfirmation: !data.session };
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!email.trim() || !password) throw new Error("Enter your email and password to log in.");
  const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await createClient().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string, email: string): Promise<CampusUser | null> {
  const { data, error } = await createClient()
    .from("profiles")
    .select("id, name, username, role, club_slug, avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfileToCampusUser(data as ProfileRecord, email) : null;
}

export async function getMyRoleRequest(): Promise<RoleRequest | null> {
  const { data, error } = await createClient()
    .from("role_requests")
    .select("id, user_id, requested_role, requested_club_slug, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    userId: data.user_id as string,
    requestedRole: data.requested_role as Exclude<UserRole, "participant">,
    requestedClubSlug: (data.requested_club_slug as string | null) ?? null,
    status: data.status as RoleRequestStatus,
    createdAt: data.created_at as string,
  };
}

export async function requestRole(role: Exclude<UserRole, "participant">, clubSlug?: string): Promise<RoleRequest> {
  const { data, error } = await createClient().rpc("request_role", {
    p_requested_role: role,
    p_requested_club_slug: role === "committee" ? clubSlug ?? null : null,
  });
  if (error) throw new Error(error.message);
  const request = data as {
    id: string; user_id: string; requested_role: Exclude<UserRole, "participant">;
    requested_club_slug: string | null; status: RoleRequestStatus; created_at: string;
  };
  return {
    id: request.id,
    userId: request.user_id,
    requestedRole: request.requested_role,
    requestedClubSlug: request.requested_club_slug,
    status: request.status,
    createdAt: request.created_at,
  };
}

export async function updateProfile(name: string, username: string, avatarPath: string | null): Promise<CampusUser> {
  const client = createClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user?.email) throw new Error("Your session has expired. Please log in again.");

  const { data, error } = await client.rpc("update_my_profile", {
    p_name: name,
    p_username: username,
    p_avatar_path: avatarPath,
  });
  if (error) throw new Error(error.message);
  return mapProfileToCampusUser(data as ProfileRecord, authData.user.email);
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file for your profile photo.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose an image smaller than 2 MB.");

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${extension}`;
  const { error } = await createClient().storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function getAvatarUrl(path: string): Promise<string | null> {
  const { data, error } = await createClient().storage.from("avatars").createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/update-password`;
  const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string): Promise<void> {
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
  const { error } = await createClient().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function isApprovalAdmin(): Promise<boolean> {
  const { data, error } = await createClient().rpc("is_approval_admin");
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listPendingRoleRequests(): Promise<PendingRoleRequest[]> {
  const { data, error } = await createClient().rpc("list_pending_role_requests");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Array<{
    id: string; user_id: string; requester_name: string; requester_email: string;
    requested_role: Exclude<UserRole, "participant">; requested_club_slug: string | null; created_at: string;
  }>).map((request) => ({
    id: request.id,
    userId: request.user_id,
    requesterName: request.requester_name,
    requesterEmail: request.requester_email,
    requestedRole: request.requested_role,
    requestedClubSlug: request.requested_club_slug,
    status: "pending",
    createdAt: request.created_at,
  }));
}

export async function decideRoleRequest(requestId: string, decision: "approved" | "rejected"): Promise<void> {
  const { error } = await createClient().rpc("decide_role_request", {
    p_request_id: requestId,
    p_decision: decision,
  });
  if (error) throw new Error(error.message);
}
