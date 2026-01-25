import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "../components/AppLayout";
import { ChurchProvider } from "../contexts/ChurchContext"; // <--- IMPORTAR

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReinoCloud - Gestão para Igrejas",
  description: "Sistema de gestão eclesiástica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Envolvemos tudo com o Provider */}
        <ChurchProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </ChurchProvider>
      </body>
    </html>
  );
}