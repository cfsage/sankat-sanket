import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PT_Sans } from "next/font/google";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Resilient Echo",
  description: "Crowdsourced Climate Resilience Network – Report. Alert. Match. Recover.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ptSans.variable} suppressHydrationWarning>
      <body className="antialiased font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
