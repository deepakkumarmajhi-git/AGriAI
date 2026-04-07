import type { Metadata } from "next";
import AppPreferencesProvider from "@/components/providers/AppPreferencesProvider";
import "./globals.css";

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
      <body className="agri-root antialiased">
        <AppPreferencesProvider />
        {children}
      </body>
    </html>
  );
}
