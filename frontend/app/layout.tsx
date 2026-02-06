import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext.js"
import LayoutWrapper from "@/components/LayoutWrapper";
import NotificationBell from "@/components/NotificationBell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "myBigYard - Rent Yards by the Hour",
  description: "Discover and book amazing yards for events, parties, and gatherings",
};

// Add these three lines to make all pages dynamic
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>

          <Navbar/>
          <LayoutWrapper>
          {children}
          </LayoutWrapper>
          <Footer/>
        </AuthProvider>
      </body>
    </html>
  );
}