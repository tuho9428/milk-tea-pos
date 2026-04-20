import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingCartButton } from "@/app/floating-cart-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Milk Tea POS",
  description: "A polished milk tea ordering flow with admin operations tooling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">
        {children}
        <FloatingCartButton />
      </body>
    </html>
  );
}
