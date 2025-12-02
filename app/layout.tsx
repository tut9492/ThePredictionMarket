import type { Metadata } from "next";
import { Aboreto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aboreto",
});

export const metadata: Metadata = {
  title: "Prediction Market Dashboard",
  description: "Market share dashboard for prediction market platforms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${aboreto.variable} font-aboreto antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

