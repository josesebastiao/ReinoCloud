import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão",
  description: "Sistema de gestão para igrejas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 flex`}>
        {/* O Menu fica fixo na esquerda */}
        <Sidebar />
        
        {/* O conteúdo da página carrega aqui na direita */}
        <main className="flex-1 h-screen overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}