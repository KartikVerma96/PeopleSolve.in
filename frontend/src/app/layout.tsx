import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#32cd32",
};

export const metadata: Metadata = {
  title: {
    default: "PeopleSolve — Free peer-to-peer doubt solving",
    template: "%s · PeopleSolve",
  },
  description:
    "100% free real-time doubt solving for JEE, NEET, UPSC, Boards, CA, SSC, and more. Help peers, earn karma, no paywalls.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${plusJakarta.variable} ${dmSans.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
