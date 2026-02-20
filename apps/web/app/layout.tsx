import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FEKM — Suivi Krav Maga (MVP)",
  description: "Starter MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
