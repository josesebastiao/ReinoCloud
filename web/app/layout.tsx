import type { Metadata } from "next";
import "./globals.css";
import { ChurchProvider } from "../contexts/ChurchContext";
import MainLayout from "../components/MainLayout"; // Importa a lógica que separamos

// AGORA ISSO FUNCIONA! (Porque não tem "use client" neste arquivo)
export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão financeira e membros para igrejas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",       // Navegadores modernos (PC/Android)
    apple: "/icon.png",      // <--- AQUI: O iPhone vai ler esse arquivo PNG!
    shortcut: "/icon.png",   // Atalho garantido
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased">
        <ChurchProvider>
           {/* Toda a lógica visual agora vive dentro do MainLayout */}
           <MainLayout>
              {children}
           </MainLayout>
        </ChurchProvider>
      </body>
    </html>
  );
}