import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitive Math Quiz",
  description: "First to solve wins.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
