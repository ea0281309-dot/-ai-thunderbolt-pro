import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Thunderbolt Pro",
  description: "AI-powered calling service with emotional intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
