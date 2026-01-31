export type CalendarEvent = {
  id: string;
  date: string; // ISO 8601
  opponent: string;
  location: string;
  is_home: boolean;
};

export type Calendar = {
  id: string;
  created_at: string;
  team_name: string;
  admin_slug: string;
  events: CalendarEvent[];
  is_premium: boolean;
};
