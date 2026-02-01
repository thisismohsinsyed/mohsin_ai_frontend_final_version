import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";
import Providers from "./providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Voice AI Agent",
  description: "Application for AI-powered voice agents",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="light">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Providers>
            <Header />
            {children}
            <Footer />
            <AiChatWidget />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}



