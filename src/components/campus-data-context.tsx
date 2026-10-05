"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { CampusEvent, Club, RsvpSubmission } from "@/lib/data";
import { useAuth } from "@/components/auth-context";
import {
  cancelRsvp as cancelRsvpRequest,
  createClub as createClubRequest,
  createEvent as createEventRequest,
  createRsvp as createRsvpRequest,
  listClubs,
  listEvents,
  listMyRsvps,
  listOrganizerRsvps,
  updateClub as updateClubRequest,
  updateEvent as updateEventRequest,
  type ClubInput,
  type EventInput,
  type OrganizerRsvp,
} from "@/lib/supabase/repository";

type CampusDataValue = {
  clubs: Club[];
  events: CampusEvent[];
  myRsvps: RsvpSubmission[];
  organizerRsvps: OrganizerRsvp[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (input: EventInput, userId: string) => Promise<void>;
  updateEvent: (eventId: string, input: EventInput) => Promise<void>;
  createRsvp: (eventId: string, userId: string, answers: RsvpSubmission["answers"]) => Promise<void>;
  cancelRsvp: (eventId: string, userId: string) => Promise<void>;
  createClub: (input: ClubInput) => Promise<void>;
  updateClub: (slug: string, input: ClubInput) => Promise<void>;
};

const CampusDataContext = createContext<CampusDataValue | null>(null);

function readableError(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load shared Campus Pulse data.";
}

export function CampusDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myRsvps, setMyRsvps] = useState<RsvpSubmission[]>([]);
  const [organizerRsvps, setOrganizerRsvps] = useState<OrganizerRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextClubs, nextEvents, nextRsvps, nextOrganizerRsvps] = await Promise.all([
        listClubs(),
        listEvents(),
        user ? listMyRsvps(user.id) : Promise.resolve([]),
        user?.role === "admin" || user?.role === "committee" ? listOrganizerRsvps() : Promise.resolve([]),
      ]);
      setClubs(nextClubs);
      setEvents(nextEvents);
      setMyRsvps(nextRsvps);
      setOrganizerRsvps(nextOrganizerRsvps);
    } catch (loadError) {
      setError(readableError(loadError));
      setClubs([]);
      setEvents([]);
      setMyRsvps([]);
      setOrganizerRsvps([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);

  const runMutation = async (mutation: () => Promise<void>) => {
    setError(null);
    try {
      await mutation();
      await refresh();
    } catch (mutationError) {
      const message = readableError(mutationError);
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <CampusDataContext.Provider value={{
      clubs,
      events,
      myRsvps,
      organizerRsvps,
      loading,
      error,
      refresh,
      createEvent: (input, userId) => runMutation(() => createEventRequest(input, userId)),
      updateEvent: (eventId, input) => runMutation(() => updateEventRequest(eventId, input)),
      createRsvp: (eventId, userId, answers) => runMutation(() => createRsvpRequest(eventId, userId, answers)),
      cancelRsvp: (eventId, userId) => runMutation(() => cancelRsvpRequest(eventId, userId)),
      createClub: (input) => runMutation(() => createClubRequest(input)),
      updateClub: (slug, input) => runMutation(() => updateClubRequest(slug, input)),
    }}>
      {children}
    </CampusDataContext.Provider>
  );
}

export function useCampusData(): CampusDataValue {
  const context = useContext(CampusDataContext);
  if (!context) throw new Error("useCampusData must be used inside CampusDataProvider.");
  return context;
}
