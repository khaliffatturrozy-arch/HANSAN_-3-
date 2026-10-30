import type { DevRole } from "@/types/roles";

export interface WorkspaceRoute { path: string; label: string; roles: DevRole[]; implemented: boolean; }

export const WORKSPACE_ROUTES: WorkspaceRoute[] = [
  { path: "/", label: "Landing", roles: ["developer", "owner"], implemented: true },
  { path: "/login", label: "Sign in", roles: ["developer", "owner"], implemented: true },
  { path: "/hq", label: "HQ", roles: ["owner", "developer"], implemented: false },
];

export const WORKSPACE_SECTIONS: Record<string, { path: string; label: string }[]> = {
  "/hq": [{ path: "/hq", label: "Overview" }],
};
