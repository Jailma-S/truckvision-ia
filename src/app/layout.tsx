import type { Metadata } from "next";
// Fontes hospedadas no próprio app (sem chamada ao Google Fonts no build ou no navegador)
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruckVision IA",
  description: "Enxergue hoje as oportunidades de amanhã",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
