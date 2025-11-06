import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistrar from "../components/ServiceWorkerRegistrar";
import { VERSION_INFO } from "../lib/version";
import Script from "next/script";

export const metadata: Metadata = {
  title: "睡眠记录 App",
  description: "本地隐私友好的睡眠记录 PWA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
        <link rel="manifest" href={`/manifest.json?v=${VERSION_INFO.version}`} />
        {/* 早期注册脚本，便于外部分析器检测到 SW（生产环境为 HTTPS）*/}
        <Script id="sw-register-inline" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
              const isHttps = location.protocol === 'https:';
              if (isHttps || isLocal) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            }
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
        {/* 注册 Service Worker */}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
