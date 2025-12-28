import type { Metadata } from "next";
import AuthProvider from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prism AI",
  description: "AI-powered research assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
