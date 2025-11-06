// src/app/dashboard/layout.tsx
import { Poppins } from "next/font/google";
import ClientCommons from "../ClientCommons";
import "../globals.css";
import "@/fonts/line-awesome-1.3.0/css/line-awesome.css";
import "@/styles/index.scss";
import "rc-slider/assets/index.css";
import { Metadata } from "next";
import { OfflineBanner } from "@/components/OfflineBanner";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RentiTool - Dashboard",
  description: "Votre tableau de bord RentiTool.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="bg-white text-base dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        <ClientCommons />
        {children}
        <OfflineBanner />
      </body>
    </html>
  );
}
