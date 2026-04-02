import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PeopleSolve — Free peer-to-peer doubt solving",
    template: "%s · PeopleSolve",
  },
  description:
    "100% free real-time doubt solving for JEE, NEET, UPSC, Boards, CA, SSC, and more. Help peers, earn karma, no paywalls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${inter.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
