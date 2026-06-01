import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "The Season | Youth Sports Team Communication",
  description:
    "A calm command center for volunteer coaches and parents: team messages, schedules, RSVPs, files, and season coordination.",
  openGraph: {
    title: "The Season",
    description:
      "One calm command center for the chaos of youth sports season.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
