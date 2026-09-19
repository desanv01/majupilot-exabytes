export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
/** Manual Phase B boundary. Regenerate from the linked project before production provisioning. */
export type Database = { public: { Tables: Record<string, { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json>; Relationships: [] }>; Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, string>; CompositeTypes: Record<string, never> } };
