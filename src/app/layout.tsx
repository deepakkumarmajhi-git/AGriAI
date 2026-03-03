import type { Metadata } from "next";
import AppPreferencesProvider from "@/components/providers/AppPreferencesProvider";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartAgri MVP",
  description: "Farmer-first smart agriculture platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} agri-root antialiased`}
      >
        <AppPreferencesProvider />
        {children}
      </body>
    </html>
  );
}
