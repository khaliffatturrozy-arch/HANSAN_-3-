export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  appName: string;
  sessionSecret: string | null;
}

function read(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getConfig(): AppConfig {
  const nodeEnvRaw = read("NODE_ENV") ?? "development";
  return {
    nodeEnv: nodeEnvRaw === "production" ? "production" : nodeEnvRaw === "test" ? "test" : "development",
    appName: read("NEXT_PUBLIC_APP_NAME") ?? "HANSAN",
    sessionSecret: read("SESSION_SECRET"),
  };
}

export function getSessionSecret(): { secret: string | null; source: "env" | "development-fallback" | "unconfigured" } {
  const cfg = getConfig();
  const env = cfg.sessionSecret;
  if (env && env.length >= 32) return { secret: env, source: "env" };
  if (cfg.nodeEnv !== "production") return { secret: "hansan-dev-only-session-key-not-for-production-use", source: "development-fallback" };
  return { secret: null, source: "unconfigured" };
}
