import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import RegisterSW from "@/components/layout/register-sw";
import OfflineSync from "@/components/layout/offline-sync";
import OfflineStatus from "@/components/layout/offline-status";

export const metadata: Metadata = {
  title: "Sankat Sanket",
  description: "From a voice in the dark — to a task in a hand.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", process.env.NEXT_PUBLIC_TAILWIND_THEME ?? "")}
            suppressHydrationWarning>
        {children}
        <RegisterSW />
        <OfflineSync />
        <OfflineStatus />
        <Toaster />
      </body>
    </html>
  );
}
