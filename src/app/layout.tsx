import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import ToastContainer from "@/components/layout/ToastContainer";

export const metadata: Metadata = {
  title: "RoomAI | Premium Interior Design",
  description: "Trasforma le foto della tua stanza in render 3D e ottieni consigli di interior design basati sull'AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="it"
        className={`${GeistSans.variable} h-full antialiased dark`}
      >
      <body className="h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
