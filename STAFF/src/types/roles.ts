export const DEV_ROLES = ["developer", "owner", "pos", "kds", "finance"] as const;
export type DevRole = (typeof DEV_ROLES)[number];

export interface DevAccount {
  role: DevRole;
  email: string;
  home: string;
  label: string;
  description: string;
}

export const DEV_ACCOUNTS: Record<DevRole, DevAccount> = {
  developer: { role: "developer", email: "developer@hansan.local", home: "/hq", label: "Developer", description: "System overview, health, flags, logs, configuration." },
  owner: { role: "owner", email: "owner@hansan.local", home: "/hq", label: "Owner / HQ", description: "Complete back-office workspace." },
  pos: { role: "pos", email: "pos@hansan.local", home: "/hq", label: "POS", description: "Order flow." },
  kds: { role: "kds", email: "kds@hansan.local", home: "/hq", label: "KDS", description: "Kitchen display." },
  finance: { role: "finance", email: "finance@hansan.local", home: "/hq", label: "Finance", description: "Transactions, refunds." },
};

export function homeForRole(role: DevRole): string {
  return "/hq";
}
