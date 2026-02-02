import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChurchProvider } from "../contexts/ChurchContext";
import MainLayout from "../components/MainLayout";

export const viewport: Viewport = {
  // MUDAMOS PARA UM AZUL ESCURO (Diferente do Header)
  themeColor: "#172554", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão financeira e membros para igrejas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.png",
    shortcut: "/icon.png",
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