import type { Metadata } from "next";
import { HQShell } from "@/components/shell/HQShell";

export const metadata: Metadata = {
  title: "HANSAN HQ",
  description: "Headquarter workspace.",
};

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <HQShell>{children}</HQShell>;
}
