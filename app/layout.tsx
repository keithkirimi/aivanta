import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AivantaAssistant from "@/components/AivantaAssistant";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aivanta — Your AI Workspace",
  description:
    "One workspace for writing, coding, learning, creating, and exploring.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#080910] font-sans text-white">
        <AivantaAssistant>{children}</AivantaAssistant>
      </body>
    </html>
  );
}
