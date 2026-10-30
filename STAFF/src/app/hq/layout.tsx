import type { Metadata } from "next";
import { StaffShell } from "@/components/shell/StaffShell";

export const metadata: Metadata = {
  title: "HANSAN Staff",
  description: "Staff workspace.",
};

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
