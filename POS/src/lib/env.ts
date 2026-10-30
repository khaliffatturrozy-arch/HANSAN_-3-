import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined> = process.env): AppEnv {
  return envSchema.parse(input);
}

export function requireDatabaseUrl(env: AppEnv = parseEnv()): string {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return env.DATABASE_URL;
}
