import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <main className="flex-1 bg-[#101624] min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

// New layout component for pages that need navbar and connect wallet
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center justify-end px-4">
          <ConnectWallet />
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}