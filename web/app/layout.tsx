import type { Metadata, Viewport } from "next"; // Adicionei Viewport aqui
import "./globals.css";
import { ChurchProvider } from "../contexts/ChurchContext";
import MainLayout from "../components/MainLayout";

// 1. CONFIGURAÇÃO DE VIEWPORT (Isso garante que o app cubra a tela toda no celular)
export const viewport: Viewport = {
  themeColor: "#2563EB", // <--- AQUI ESTÁ A MÁGICA! (Azul exato do header)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // <--- Isso faz o site entrar "atrás" do notch do iPhone
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