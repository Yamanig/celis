// Placeholder: generate real types with `supabase gen types --lang=typescript ...`
export type Database = {
  public: {
    Tables: {
      users: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      listings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      orders: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      wallet_payments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, unknown>;
  };
  storage: unknown;
};
