import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HANSAN POS — Sign in",
  description: "Point of Sale sign-in for HANSAN F&B operations platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

