import type { Metadata } from "next";
import { Young_Serif, Instrument_Sans } from "next/font/google";
import { getCompany } from "@/lib/data";
import "./globals.css";

const display = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display-face" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans-face" });

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany();
  return { title: company.name, description: company.tagline ?? undefined };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
