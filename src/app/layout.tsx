import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Listener - Social Media Brand Monitoring",
  description: "Monitor brand mentions, sentiment, and trending topics across social media platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
