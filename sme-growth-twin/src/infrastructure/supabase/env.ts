import "server-only";
import { z } from "zod";

const publicEnvSchema = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.url(), NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20) });
const serverEnvSchema = publicEnvSchema.extend({ SUPABASE_SECRET_KEY: z.string().min(20), MAJUPILOT_GUEST_TOKEN_PEPPER: z.string().min(32) });
export const getPublicSupabaseEnv = () => publicEnvSchema.parse(process.env);
export const getServerSupabaseEnv = () => serverEnvSchema.parse(process.env);
