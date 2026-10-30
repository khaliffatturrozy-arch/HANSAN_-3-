import type { DevRole } from "@/types/roles";

const WORKSPACE_ACCESS: Readonly<Record<string, readonly DevRole[]>> = {
  "/hq": ["owner", "developer"],
};

export function workspaceAllowed(role: DevRole, workspacePath: string): boolean {
  const allowed = WORKSPACE_ACCESS[workspacePath];
  return Boolean(allowed && allowed.includes(role));
}
