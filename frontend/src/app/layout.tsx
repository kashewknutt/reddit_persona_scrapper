import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from 'next/script'

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reddit Persona Profiler",
  description: "Unlock deep insights into Reddit users through AI-powered personality analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <Script defer src="https://cloud.umami.is/script.js" data-website-id="5284f569-3946-4b86-ba36-efe03a34cd68" />
      </head>
      <body className={`${interFont.variable} antialiased`}>
      {children}
      </body>
    </html>
  );
}
