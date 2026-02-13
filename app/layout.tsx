import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VibeClonePro | AI Architecture",
  description: "Clone, Build, Monetize.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#020502] text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
