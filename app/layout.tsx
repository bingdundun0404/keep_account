import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "睡眠记录 App",
  description: "本地隐私友好的睡眠记录 PWA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0b0b" />
      </head>
      <body className="min-h-screen bg-black text-zinc-50">
        {children}
      </body>
    </html>
  );
}
