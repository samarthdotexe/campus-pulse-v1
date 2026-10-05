import { describe, expect, it } from "vitest";
import { mapProfileToCampusUser, validateSignUpInput } from "./auth";

describe("mapProfileToCampusUser", () => {
  it("maps a participant profile without organizer privileges", () => {
    expect(
      mapProfileToCampusUser(
        {
          id: "profile-1",
          name: "Avery Participant",
          username: "avery_participant",
          role: "participant",
          club_slug: null,
          avatar_path: null,
        },
        "avery@campus.edu"
      )
    ).toEqual({
      id: "profile-1",
      name: "Avery Participant",
      username: "avery_participant",
      email: "avery@campus.edu",
      role: "participant",
    });
  });

  it("maps a committee profile to its assigned club", () => {
    expect(
      mapProfileToCampusUser(
        {
          id: "profile-2",
          name: "Casey Organizer",
          username: "casey_organizer",
          role: "committee",
          club_slug: "robotics-club",
          avatar_path: "profile-2/avatar.webp",
        },
        "casey@campus.edu"
      )
    ).toEqual({
      id: "profile-2",
      name: "Casey Organizer",
      username: "casey_organizer",
      email: "casey@campus.edu",
      role: "committee",
      clubSlug: "robotics-club",
      avatarPath: "profile-2/avatar.webp",
    });
  });

  it("maps an admin profile without inventing a club assignment", () => {
    expect(
      mapProfileToCampusUser(
        {
          id: "profile-3",
          name: "Riley Admin",
          username: "riley_admin",
          role: "admin",
          club_slug: null,
          avatar_path: null,
        },
        "riley@campus.edu"
      )
    ).toEqual({
      id: "profile-3",
      name: "Riley Admin",
      username: "riley_admin",
      email: "riley@campus.edu",
      role: "admin",
    });
  });
});

describe("validateSignUpInput", () => {
  it("requires a club when Club Member access is requested", () => {
    expect(
      validateSignUpInput({
        name: "Casey Organizer",
        username: "casey_organizer",
        email: "casey@campus.edu",
        password: "password123",
        confirmPassword: "password123",
        requestedRole: "committee",
        requestedClubSlug: "",
      })
    ).toBe("Choose the club you want to represent.");
  });

  it("requires a normalized username", () => {
    expect(validateSignUpInput({ name: "Avery", username: "Avery Name", email: "avery@campus.edu", password: "password123", confirmPassword: "password123", requestedRole: "participant" })).toContain("username");
  });
});
