import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/components/auth-context";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Campus Pulse",
  description: "A Unified Event Discovery Platform for Campus Life",
  icons: { icon: "/campus-pulse-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-black text-white antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Navbar />
          <main className="pt-16"><AuthProvider>{children}</AuthProvider></main>
        </ThemeProvider>
      </body>
    </html>
  );
}
