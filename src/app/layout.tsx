import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEXUS 4.0 | CMMS Asset Management",
  description: "Sistema inteligente de gestión de activos y mantenimiento industrial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="app-layout">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="content-wrapper">
            <MobileHeader />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
