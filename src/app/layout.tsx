import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/ui/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ContractOS — Gestión de Contratos",
  description: "Sistema de gestión de contratos con control de versiones y colaboración",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.variable} style={{ fontFamily: "var(--font-sans)" }}>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
