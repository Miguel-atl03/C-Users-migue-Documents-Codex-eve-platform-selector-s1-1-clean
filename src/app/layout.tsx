import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const eveDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-eve-display",
  display: "swap",
});

const eveBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-eve-body",
  display: "swap",
});

const eveMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-eve-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EVE MVP Relacional",
  description: "Plataforma web para captura relacional de actividades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${eveDisplay.variable} ${eveBody.variable} ${eveMono.variable}`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
