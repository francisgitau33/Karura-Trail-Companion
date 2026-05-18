import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: 'Karura Forest Trail Companion',
  description:
    "A free digital trail companion for Karura Forest visitors, developed as a public resource by Kenya Children's Home.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
