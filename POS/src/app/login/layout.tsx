import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HANSAN POS — Sign in",
  description: "Point of Sale sign-in for the HANSAN F&B operations platform.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
