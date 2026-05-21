import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IQ-RA System - Koperasi Syariah Digital (KSD)",
  description: "Platform Keuangan Mikro Syariah Terintegrasi AI Berbasis Standar Kepatuhan Akuntansi SAK EP & Fatwa DSN-MUI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full scroll-smooth">
      <head>
        {/* Load premium Typography from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 antialiased selection:bg-emerald-200 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
