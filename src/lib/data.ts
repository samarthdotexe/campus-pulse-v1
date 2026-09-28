export type UserRole = "participant" | "committee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubSlug?: string;
}

export interface RsvpQuestion {
  id: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio";
  label: string;
  required: boolean;
  options?: string[];
}

export interface RsvpSubmission {
  id: string;
  eventId: string;
  userId: string;
  answers: Record<string, string | string[] | boolean>;
  submittedAt: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  clubSlug: string;
  rsvps: number;
  capacity: number;
  coverImage?: string;
  createdBy: string;
  rsvpQuestions: RsvpQuestion[];
}

export interface Club {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  memberCount: number;
  color: string;
}

export const clubs: Club[] = [
  { slug: "tech-club", name: "Tech Club", tagline: "Build. Break. Ship.", description: "The campus developer community. We run hackathons, open-source sprints, and weekly build sessions. If you ship code, you belong here.", category: "Technology", memberCount: 142, color: "#7bd8c4" },
  { slug: "entrepreneur-club", name: "Entrepreneur Club", tagline: "From idea to IPO", description: "We connect aspiring founders with mentors, investors, and each other. Pitch nights, startup weekends, and founder talks every month.", category: "Business", memberCount: 98, color: "#f0d46a" },
  { slug: "ai-ml-club", name: "AI/ML Club", tagline: "Pixels with purpose", description: "Exploring artificial intelligence and machine learning through workshops, paper readings, and hands-on projects.", category: "Technology", memberCount: 76, color: "#ec5c13" },
  { slug: "dsa-club", name: "DSA Club", tagline: "Master the fundamentals", description: "Data structures and algorithms practice sessions, competitive programming contests, and interview prep workshops.", category: "Academics", memberCount: 210, color: "#e04860" },
  { slug: "sports-club", name: "Sports Club", tagline: "Game on", description: "Inter-hostel tournaments, fitness challenges, sports screenings, and recreational leagues for every sport on campus.", category: "Sports", memberCount: 320, color: "#4ade80" },
  { slug: "communications-club", name: "Communications Club", tagline: "Argue better", description: "Public speaking workshops, debate tournaments, media production, and communication skills development.", category: "Arts & Culture", memberCount: 64, color: "#6c8cff" },
];

export const events: CampusEvent[] = [
  { id: "hack-the-future", title: "Hack The Future", description: "A 24-hour hackathon focused on AI-powered campus solutions. Build something that makes student life better. Prizes worth 50K.", date: "2026-10-05", time: "10:00 AM", location: "Innovation Lab, Block C", clubSlug: "tech-club", rsvps: 87, capacity: 150, createdBy: "system", rsvpQuestions: [] },
  { id: "pitch-night-vol3", title: "Pitch Night Vol. 3", description: "Five student startups pitch to a panel of real investors. Come watch or come pitch — registrations open till Oct 3.", date: "2026-10-04", time: "6:00 PM", location: "Seminar Hall A", clubSlug: "entrepreneur-club", rsvps: 134, capacity: 200, createdBy: "system", rsvpQuestions: [] },
  { id: "ml-workshop", title: "Intro to Neural Networks", description: "Hands-on workshop building your first neural network from scratch. Bring your laptop and Python installed.", date: "2026-10-02", time: "2:00 PM", location: "AI Lab, 3rd Floor", clubSlug: "ai-ml-club", rsvps: 42, capacity: 50, createdBy: "system", rsvpQuestions: [] },
  { id: "leetcode-contest", title: "Weekly LeetCode Contest", description: "Competitive programming contest with prizes for top 3. All skill levels welcome.", date: "2026-10-06", time: "7:00 PM", location: "CS Lab 1", clubSlug: "dsa-club", rsvps: 156, capacity: 300, createdBy: "system", rsvpQuestions: [] },
  { id: "mun-prep-session", title: "MUN Prep: Crisis Committee", description: "Practice crisis committee procedures before the inter-college MUN next month. All experience levels welcome.", date: "2026-10-03", time: "4:00 PM", location: "Room 204, Arts Block", clubSlug: "communications-club", rsvps: 28, capacity: 40, createdBy: "system", rsvpQuestions: [] },
  { id: "inter-hostel-football", title: "Inter-Hostel Football Semifinals", description: "Block A vs Block D in the first semifinal. Come support your hostel and enjoy the match day atmosphere.", date: "2026-10-07", time: "4:30 PM", location: "Main Football Ground", clubSlug: "sports-club", rsvps: 240, capacity: 500, createdBy: "system", rsvpQuestions: [] },
  { id: "oss-sprint", title: "Open Source Sprint", description: "Pick an issue, submit a PR, get mentored. We contribute to real open-source projects together every Saturday.", date: "2026-10-04", time: "11:00 AM", location: "CS Lab 2", clubSlug: "tech-club", rsvps: 31, capacity: 40, createdBy: "system", rsvpQuestions: [] },
  { id: "founder-talk", title: "Founder Talk: Building in College", description: "A fireside chat with two alumni who started their companies during college. Q&A and networking after.", date: "2026-10-08", time: "5:00 PM", location: "Auditorium", clubSlug: "entrepreneur-club", rsvps: 189, capacity: 250, createdBy: "system", rsvpQuestions: [] },
];
