import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/providers/firebase-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Ordens de Serviço",
  description: "Sistema completo para gerenciamento de ordens de serviço",
  keywords: ["Ordens de Serviço", "OS", "Gestão", "Next.js", "TypeScript"],
  authors: [{ name: "Sistema OS" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Sistema de Ordens de Serviço",
    description: "Sistema completo para gerenciamento de ordens de serviço",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema de Ordens de Serviço",
    description: "Sistema completo para gerenciamento de ordens de serviço",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <FirebaseProvider>
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
