import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "~/styles/globals.css";
import { GameProvider } from "~/contexts/GameContext";
import { AuthProvider } from "~/contexts/AuthContext";
import { Navbar } from "~/components/layout/Navbar";
import { Footer } from "~/components/layout/Footer";
import { Overlays } from "~/components/layout/Overlays";
import { FieldGuideDialog } from "~/components/FieldGuideDialog";
import { AccountDialog } from "~/components/AccountDialog";

export const metadata: Metadata = {
  title: "Linux Mastery — learn the terminal by playing",
  description: "Interactive Linux command-line missions with Maya, a real-feeling shell, XP and a Field Guide.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-lm-void font-sans text-lm-ink antialiased">
        <GameProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <FieldGuideDialog />
            <AccountDialog />
            <Overlays />
          </AuthProvider>
        </GameProvider>
      </body>
    </html>
  );
}
