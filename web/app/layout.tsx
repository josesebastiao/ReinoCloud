import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "../components/AppLayout";
import { ChurchProvider } from "../contexts/ChurchContext"; // <--- VERIFIQUE ESTE IMPORT

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
        {/* O PROVIDER TEM QUE ESTAR POR FORA DE TUDO */}
        <ChurchProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </ChurchProvider>
      </body>
    </html>
  );
}