import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://benot.store"),
  title: {
    default: "BENOT | Camisetas que no piden permiso",
    template: "%s | BENOT",
  },
  description:
    "Camisetas personalizadas con frases que no piden permiso. Estética urbana, streetwear y actitud. Pide tu diseño por Telegram — envío rápido.",
  keywords: [
    "camisetas personalizadas",
    "camisetas con frases",
    "streetwear",
    "BENOT",
    "camisetas anime",
    "camisetas running",
    "pedido por telegram",
    "ropa urbana",
  ],
  authors: [{ name: "BENOT" }],
  creator: "BENOT",
  publisher: "BENOT",
  openGraph: {
    title: "BENOT | Camisetas que no piden permiso",
    description:
      "Camisetas personalizadas con frases que no piden permiso. Streetwear con actitud. Pide tu diseño por Telegram.",
    url: "https://benot.store",
    siteName: "BENOT",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/assets/logo/logo.png",
        width: 400,
        height: 160,
        alt: "BENOT — Camisetas que no piden permiso",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BENOT | Camisetas que no piden permiso",
    description:
      "Camisetas personalizadas con frases que no piden permiso. Streetwear con actitud.",
    images: ["/assets/logo/logo.png"],
  },
  icons: {
    icon: "/assets/logo/logo.png",
    shortcut: "/assets/logo/logo.png",
    apple: "/assets/logo/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://benot.store",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${bebas.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
