import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ModelInitializer } from "@/components/ModelInitializer";
import { NotificationSystem } from "@/components/NotificationSystem";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "600", "700"], variable: '--font-poppins' });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "600", "700"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "PantryVeda",
  description: "Smart grocery and meal management for Indian cuisine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-sans`}>
        <ModelInitializer />
        <NotificationSystem />
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}