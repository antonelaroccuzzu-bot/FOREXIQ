import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "0KX — Digital Asset Investments",
  description: "0KX digital asset investment workspace. Review supported crypto deposit networks and manage investment activity.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
