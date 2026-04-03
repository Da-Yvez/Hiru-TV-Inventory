import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiru TV Inventory System",
  description: "IT Asset & Inventory Management System for Hiru TV",
  icons: {
    icon: "/logo.jpg", // Using your logo as the favicon
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. Dark Reader) mutate <html>/descendants before hydration */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
