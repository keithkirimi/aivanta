
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
  title: "Aivanta AI — All-in-One AI Workspace",
  description:
    "Write, create, learn, and build with Aivanta AI tools.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AivantaAssistant />
        {children}
      </body>
    </html>
  );
}
