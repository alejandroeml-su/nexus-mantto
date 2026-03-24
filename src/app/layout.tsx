import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEXUS 4.0 | CMMS Asset Management",
  description: "Sistema inteligente de gestión de activos y mantenimiento industrial.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  const isAuthenticated = !!session?.value;

  return (
    <html lang="es">
      <body className={inter.className}>
        {isAuthenticated ? (
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
        ) : (
          <main>
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
