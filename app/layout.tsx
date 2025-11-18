import type { Metadata } from "next";
import { Aboreto } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}

