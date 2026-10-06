import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liquid Study Space",
  description: "Dein persönliches Studien-Dashboard mit aktuellem Stundenplan.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Liquid Study Space",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06101f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
