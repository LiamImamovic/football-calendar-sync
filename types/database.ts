export type CalendarEvent = {
  id: string;
  date: string; // ISO 8601
  opponent: string;
  location: string;
  is_home: boolean;
  cancelled?: boolean;
};

export type Calendar = {
  id: string;
  created_at: string;
  team_name: string;
  admin_slug: string;
  events: CalendarEvent[];
  is_premium: boolean;
  club_id: string | null;
  created_by: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ClubRole = "owner" | "coach" | "viewer";

export type Club = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  address: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  owner_id: string;
};

export type ClubMember = {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubRole;
  created_at: string;
};

export type ClubInvite = {
  id: string;
  club_id: string;
  email: string;
  role: ClubRole;
  token: string;
  expires_at: string;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  max_coaches: number;
  max_calendars_per_club: number;
  features: Record<string, unknown>;
};

export type Subscription = {
  id: string;
  club_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};
