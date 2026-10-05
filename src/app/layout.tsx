import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/components/auth-context";
import { CampusDataProvider } from "@/components/campus-data-context";

export const metadata: Metadata = {
  title: "Campus Pulse",
  description: "A Unified Event Discovery Platform for Campus Life",
  icons: { icon: "/campus-pulse-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <CampusDataProvider>
              <Navbar />
              <main className="pt-16">{children}</main>
            </CampusDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
