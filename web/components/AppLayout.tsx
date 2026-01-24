import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "../components/AppLayout"; // <--- Importamos o novo componente

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão eclesiástica",
};

// ATENÇÃO: Aqui PRECISA ter o 'default' para o Next.js funcionar
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Usamos o AppLayout para controlar o menu */}
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}