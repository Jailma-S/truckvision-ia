import type { Metadata } from "next";
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
