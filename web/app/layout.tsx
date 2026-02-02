import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChurchProvider } from "../contexts/ChurchContext";
import MainLayout from "../components/MainLayout";

export const viewport: Viewport = {
  themeColor: "#0F172A", // Azul Escuro (Barra de Status)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // viewportFit: cover REMOVIDO para garantir a barra separada
};

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão financeira e membros para igrejas.",
  // --- TRUQUE DO CACHE BUSTER (?v=2) ---
  manifest: "/manifest.json?v=2", 
  icons: {
    icon: "/icon.svg",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  // --- FORÇAR IPHONE A OBEDECER ---
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Tenta pegar a cor do tema
    title: "ReinoCloud",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        <ChurchProvider>
           <MainLayout>
              {children}
           </MainLayout>
        </ChurchProvider>
      </body>
    </html>
  );
}