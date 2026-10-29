import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOREXIQ — Trade Smarter. See Further.",
  description: "AI-assisted market research, risk awareness and trading tools for forex and crypto traders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
