import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChurchProvider } from "../contexts/ChurchContext";
import MainLayout from "../components/MainLayout";

export const viewport: Viewport = {
  themeColor: "#1E3A8A", // blue-800
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // <--- ISSO É OBRIGATÓRIO PARA O PLANO FUNCIONAR
};

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão financeira e membros para igrejas.",
  manifest: "/manifest.json?v=3", // Mudei para v=3 para forçar atualização
  icons: {
    icon: "/icon.svg",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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