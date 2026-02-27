import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Header } from "@/components/Header";
import { AuthGuard } from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZR Hauls Quote Builder",
  description: "Internal tool for generating haul quotes and Discord-formatted messages",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
