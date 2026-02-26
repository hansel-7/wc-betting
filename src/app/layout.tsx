import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import VideoSplash from "@/components/VideoSplash";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vinacado - World Cup 2026 Pool",
  description: "Company betting pool for FIFA World Cup 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#161212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-forest-950 text-white`}>
        <VideoSplash />
        {children}
      </body>
    </html>
  );
}
