import { describe, expect, it } from "vitest";
import { mapEventRecord } from "./repository";

describe("mapEventRecord", () => {
  it("preserves the local event date and time from a timestamp", () => {
    const event = mapEventRecord({
      id: "d2e13c35-68e7-465a-9dbf-7e1f2b9ab843",
      title: "Open Source Sprint",
      description: "Ship a contribution.",
      starts_at: "2026-10-04T05:30:00.000Z",
      location: "CS Lab 2",
      capacity: 40,
      cover_image_url: null,
      created_by: "a4a0df3f-ecf0-4ec9-a8bc-4d77020c8b31",
      rsvp_count: 31,
      clubs: { slug: "tech-club" },
      rsvp_questions: [
        {
          id: "f34fcb76-2a15-4cbd-82cf-7fcb0ca677ca",
          label: "T-shirt size",
          type: "select",
          required: true,
          options: ["S", "M", "L"],
          position: 0,
        },
      ],
    });

    expect(event).toMatchObject({
      id: "d2e13c35-68e7-465a-9dbf-7e1f2b9ab843",
      date: "2026-10-04",
      time: "11:00 AM",
      clubSlug: "tech-club",
      rsvps: 31,
    });
    expect(event.rsvpQuestions).toEqual([
      expect.objectContaining({ label: "T-shirt size", options: ["S", "M", "L"] }),
    ]);
  });

  it("rejects an event record without its club slug", () => {
    expect(() => mapEventRecord({
      id: "d2e13c35-68e7-465a-9dbf-7e1f2b9ab843",
      title: "Incomplete event",
      description: "Missing relation.",
      starts_at: "2026-10-04T05:30:00.000Z",
      location: "CS Lab 2",
      capacity: 40,
      created_by: "a4a0df3f-ecf0-4ec9-a8bc-4d77020c8b31",
      rsvp_count: 0,
      clubs: null,
      rsvp_questions: [],
    })).toThrow("club");
  });
});
