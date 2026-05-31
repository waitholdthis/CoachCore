import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CoachCore — Smart Youth Sports Rulebook",
  description: "Instant rule answers for coaches and parents across Soccer, Baseball, Basketball, and Football.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
