import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HANSAN HQ — Sign in",
  description: "Headquarter sign-in for the HANSAN F&B operations platform.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
