"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sidebar state persistence in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load saved state (default: true/open)
    const saved = localStorage.getItem("sidebar:state");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }
  }, []);

  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("sidebar:state", String(open));
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider
            open={sidebarOpen}
            onOpenChange={handleSidebarChange}
            style={{
              "--sidebar-width": "15rem",
            } as React.CSSProperties}
          >
            <AppSidebar />
            <SidebarInset>
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
