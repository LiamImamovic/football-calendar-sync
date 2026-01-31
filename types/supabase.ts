export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      calendars: {
        Row: {
          id: string;
          created_at: string;
          team_name: string;
          admin_slug: string;
          events: Json;
          is_premium: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          team_name: string;
          admin_slug: string;
          events?: Json;
          is_premium?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          team_name?: string;
          admin_slug?: string;
          events?: Json;
          is_premium?: boolean;
        };
      };
    };
  };
}
