import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solicitação de Declaração de Matrícula",
  description: "Sistema para solicitação de declaração de matrícula",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        {children}
        <footer className="footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} - Sistema de Declaração de Matrícula</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
