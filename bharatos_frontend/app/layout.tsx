import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BharatOS - Prayagraj Urban Command Center",
  description:
    "3D Digital Twin & Predictive Flood Simulation Platform for urban monitoring and disaster resilience.",
  keywords: [
    "BharatOS",
    "Digital Twin",
    "Prayagraj",
    "Flood Simulation",
    "Urban Planning",
    "MapLibre 3D",
  ],
  authors: [{ name: "BharatOS Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BharatOS - Prayagraj Urban Command Center",
    description: "3D Digital Twin & Predictive Flood Simulation Platform",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
    >
      <head>
        {/* Preconnect & map stylesheet fallback */}
        <link rel="preconnect" href="https://demotiles.maplibre.org" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
      </head>
      <body className="relative h-screen w-screen overflow-hidden bg-slate-900 font-sans text-slate-900 select-none">
        {/* Main application container mount */}
        <main className="relative h-full w-full overflow-hidden flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}